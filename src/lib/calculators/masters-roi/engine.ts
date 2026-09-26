/**
 * Master's Degree ROI — deterministic calculation engine.
 *
 * Compares two cash-flow paths starting at t = 0 (the day the program starts):
 *
 *   No-degree path: keep working at the current salary S₀, growing at g per year.
 *   Degree path:    pay education costs evenly over the study period [0, D],
 *                   then (after an optional job search of J months) earn the
 *                   post-degree salary P₀, growing at g per year.
 *
 * The "cumulative advantage" A(t) = degree-path cash − no-degree cash is the
 * core quantity; every headline metric is derived from it. See
 * docs/ARCHITECTURE.md §5 for the full specification.
 *
 * This module is pure: no I/O, no randomness, no clock, no React. It never uses
 * an LLM or any external service.
 */

import type { Assumption } from "../types";
import { cumulativeEarnings, earningsBetween, salaryAt } from "../../finance/growth";
import { firstNonNegative } from "../../finance/piecewise";
import { MODEL_CONSTANTS } from "./defaults";
import type { BreakEven, MastersRoiInputs, MastersRoiResult, TimelinePoint } from "./types";
import { validateMastersRoiInputs } from "./validation";

// ---------------------------------------------------------------------------
// Building-block formulas (exported individually so each can be unit-tested)
// ---------------------------------------------------------------------------

/** Living expenses over the whole program: L × D. */
export function totalLivingCost(i: MastersRoiInputs): number {
  return i.livingExpenses * i.studyDurationYears;
}

/** Tuition + living costs − scholarship. Can be negative when funding exceeds costs. */
export function totalEducationCost(i: MastersRoiInputs): number {
  return i.tuition + totalLivingCost(i) - i.scholarship;
}

/** Time (years from program start) when the first post-degree paycheck arrives: D + J/12. */
export function postDegreeEmploymentStart(i: MastersRoiInputs): number {
  return i.studyDurationYears + i.jobSearchMonths / 12;
}

/** Salary the no-degree path would have earned from t = 0 until the post-degree job starts. */
export function opportunityCost(i: MastersRoiInputs): number {
  return cumulativeEarnings(i.currentSalary, i.salaryGrowthRate, postDegreeEmploymentStart(i));
}

/** Education cost + opportunity cost. */
export function netInvestment(i: MastersRoiInputs): number {
  return totalEducationCost(i) + opportunityCost(i);
}

/** Annual salary on the no-degree path when the post-degree job starts: S₀·(1+g)^⌊D + J/12⌋. */
export function counterfactualSalaryAtStart(i: MastersRoiInputs): number {
  return salaryAt(i.currentSalary, i.salaryGrowthRate, postDegreeEmploymentStart(i));
}

/** First-year salary premium of the degree path over the no-degree path. */
export function annualIncomeIncrease(i: MastersRoiInputs): number {
  return i.postDegreeSalary - counterfactualSalaryAtStart(i);
}

/** Education cost paid by time t, with costs spread evenly over the study period. */
export function educationCostPaidBy(i: MastersRoiInputs, t: number): number {
  const cost = totalEducationCost(i);
  const d = i.studyDurationYears;
  if (t <= 0) return 0;
  if (t >= d) return cost;
  return (cost * t) / d;
}

/**
 * Cumulative advantage A(t): degree-path cash minus no-degree cash at time t
 * (years from program start). Negative means the degree is still "behind".
 */
export function cumulativeAdvantage(i: MastersRoiInputs, t: number): number {
  const start = postDegreeEmploymentStart(i);
  const degreeEarnings = earningsBetween(i.postDegreeSalary, i.salaryGrowthRate, 0, t - start);
  const baselineEarnings = cumulativeEarnings(i.currentSalary, i.salaryGrowthRate, t);
  return degreeEarnings - educationCostPaidBy(i, t) - baselineEarnings;
}

/**
 * All times in [0, end] where A(t) can change slope: salary anniversaries of
 * both paths, the end of study and the start of post-degree employment.
 * Between these points A(t) is exactly linear.
 */
export function advantageBreakpoints(i: MastersRoiInputs, end: number): number[] {
  const start = postDegreeEmploymentStart(i);
  const points: number[] = [i.studyDurationYears, start];
  for (let k = 1; k <= Math.ceil(end); k++) points.push(k); // no-degree raises
  for (let k = 1; start + k <= end; k++) points.push(start + k); // degree-path raises
  return points;
}

/**
 * Break-even: the first time after post-degree employment starts at which the
 * cumulative advantage is ≥ 0. Solved exactly (A is piecewise linear).
 */
export function breakEven(
  i: MastersRoiInputs,
  horizonYears: number = MODEL_CONSTANTS.breakEvenHorizonYears,
): BreakEven {
  const d = i.studyDurationYears;
  const start = postDegreeEmploymentStart(i);
  const end = d + horizonYears;

  if (netInvestment(i) <= 0) {
    // Nothing to recover: the degree is never behind at graduation.
    return { reached: true, yearsAfterGraduation: 0, yearsFromStart: d, horizonYears };
  }

  const t = firstNonNegative(
    (x) => cumulativeAdvantage(i, x),
    advantageBreakpoints(i, end),
    start,
    end,
  );

  if (t === null) {
    return { reached: false, yearsAfterGraduation: null, yearsFromStart: null, horizonYears };
  }
  return { reached: true, yearsAfterGraduation: t - d, yearsFromStart: t, horizonYears };
}

/** Cumulative net position N years after graduation (t = D + N). */
export function impactAfterGraduation(i: MastersRoiInputs, years: number): number {
  return cumulativeAdvantage(i, i.studyDurationYears + years);
}

/** Samples A(t) from t = 0 to D + horizon on a regular grid, plus key event times. */
export function buildTimeline(
  i: MastersRoiInputs,
  horizonYears: number = MODEL_CONSTANTS.longHorizonYears,
  stepsPerYear: number = MODEL_CONSTANTS.timelineStepsPerYear,
): TimelinePoint[] {
  const end = i.studyDurationYears + horizonYears;
  const times = new Set<number>();
  const steps = Math.round(end * stepsPerYear);
  for (let s = 0; s <= steps; s++) times.add(round6(Math.min(end, s / stepsPerYear)));
  times.add(round6(i.studyDurationYears));
  times.add(round6(postDegreeEmploymentStart(i)));
  times.add(round6(end));
  // Exact whole years after graduation, so yearly tables read exact values.
  for (let k = 0; k <= horizonYears; k++) times.add(round6(i.studyDurationYears + k));
  return [...times]
    .filter((t) => t <= end)
    .sort((a, b) => a - b)
    .map((t) => ({ t, advantage: cumulativeAdvantage(i, t) }));
}

function round6(x: number): number {
  return Math.round(x * 1e6) / 1e6;
}

// ---------------------------------------------------------------------------
// Assumptions (returned as data and rendered verbatim in the UI)
// ---------------------------------------------------------------------------

export function describeAssumptions(i: MastersRoiInputs): Assumption[] {
  const start = postDegreeEmploymentStart(i);
  return [
    {
      id: "nominal-pretax",
      label: "Money is nominal and pre-tax",
      unit: "text",
      detail:
        "Figures are not adjusted for inflation, taxes or the time value of money. Enter after-tax salaries if you want a take-home view.",
    },
    {
      id: "growth",
      label: "Salary growth on both paths",
      value: i.salaryGrowthRate,
      unit: "percent",
      detail:
        "Both salaries rise once a year by this rate: the no-degree salary from today, the post-degree salary from your first post-degree job.",
    },
    {
      id: "costs-spread",
      label: "Education costs spread evenly over the program",
      value: i.studyDurationYears,
      unit: "years",
      detail:
        "Tuition, living costs and scholarship are treated as paid in equal instalments across the study period.",
    },
    {
      id: "living-full",
      label: "Living expenses counted in full",
      value: totalLivingCost(i),
      unit: "currency",
      detail:
        "All living expenses during study are counted as a cost of the degree. If you'd pay them anyway while working, enter only the extra amount.",
    },
    {
      id: "opportunity-period",
      label: "Income forgone until the new job starts",
      value: start,
      unit: "years",
      detail:
        "You give up your current salary (with raises) for the study period plus any job-search months.",
    },
    {
      id: "job-search",
      label: "Job search after graduation",
      value: i.jobSearchMonths,
      unit: "months",
      detail: "Months with no income on the degree path between graduation and the first paycheck.",
    },
    {
      id: "counterfactual",
      label: "No-degree salary when the new job starts",
      value: counterfactualSalaryAtStart(i),
      unit: "currency",
      detail:
        "The income increase is measured against this figure, not today's salary, because you'd have received raises by then.",
    },
    {
      id: "horizon",
      label: "Break-even search horizon",
      value: MODEL_CONSTANTS.breakEvenHorizonYears,
      unit: "years",
      detail: "If the degree hasn't paid back within this many years after graduation, it is reported as not breaking even.",
    },
    {
      id: "non-financial",
      label: "Only financial effects are modelled",
      unit: "text",
      detail:
        "Career options, visas, networks, job security and personal fulfilment are real but excluded from the numbers.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Runs the full Master's ROI model.
 * @throws RangeError if the inputs fail validation.
 */
export function calculateMastersRoi(inputs: MastersRoiInputs): MastersRoiResult {
  const validation = validateMastersRoiInputs(inputs);
  if (!validation.valid) {
    const messages = Object.values(validation.errors).join(" ");
    throw new RangeError(`Invalid inputs: ${messages}`);
  }

  const invest = netInvestment(inputs);
  const impact10 = impactAfterGraduation(inputs, MODEL_CONSTANTS.longHorizonYears);

  return {
    inputs: { ...inputs },
    totalEducationCost: totalEducationCost(inputs),
    totalLivingCost: totalLivingCost(inputs),
    opportunityCost: opportunityCost(inputs),
    netInvestment: invest,
    counterfactualSalaryAtStart: counterfactualSalaryAtStart(inputs),
    annualIncomeIncrease: annualIncomeIncrease(inputs),
    breakEven: breakEven(inputs),
    impact5Year: impactAfterGraduation(inputs, MODEL_CONSTANTS.shortHorizonYears),
    impact10Year: impact10,
    return10Year: invest > 0 ? impact10 / invest : null,
    timeline: buildTimeline(inputs),
    assumptions: describeAssumptions(inputs),
  };
}
