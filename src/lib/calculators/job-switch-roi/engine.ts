/**
 * Job Switch ROI — deterministic calculation engine.
 *
 * Compares two cash-flow paths starting today (t = 0, the day you resign):
 *
 *   Stay:   keep the current package (salary + bonus + benefits), growing by
 *           the current job's raise rate once a year from today.
 *   Switch: pay the one-time switching costs today (compensation left behind +
 *           moving costs − signing bonus), earn nothing during the gap, then
 *           earn the new package from t = gap, growing by the new job's raise
 *           rate once a year from the start date, minus any extra yearly costs.
 *
 * The cumulative advantage A(t) = switch cash − stay cash drives every metric.
 * Because one-time items land at t = 0, A is continuous and piecewise linear
 * for t > 0, so break-even is solved exactly.
 *
 * Pure: no I/O, no randomness, no clock, no React, no LLM.
 */

import { earningsBetween, salaryAt } from "../../finance/growth";
import { stableNonNegativeFrom } from "../../finance/piecewise";
import type { Assumption } from "../types";
import { JOB_SWITCH_MODEL_CONSTANTS } from "./defaults";
import type { JobSwitchBreakEven, JobSwitchInputs, JobSwitchResult, TimelinePoint } from "./types";
import { validateJobSwitchInputs } from "./validation";

// ---------------------------------------------------------------------------
// Building blocks (exported for unit tests)
// ---------------------------------------------------------------------------

/** Current total package: salary + bonus + benefits. */
export function currentPackage(i: JobSwitchInputs): number {
  return i.currentSalary + i.currentBonus + i.currentBenefits;
}

/** New total package: salary + bonus + benefits. */
export function newPackage(i: JobSwitchInputs): number {
  return i.newSalary + i.newBonus + i.newBenefits;
}

/** Start date of the new job, in years from today. */
export function newJobStart(i: JobSwitchInputs): number {
  return i.gapMonths / 12;
}

/** Forfeited compensation + moving costs − signing bonus. Negative when the signing bonus covers everything. */
export function oneTimeNetCost(i: JobSwitchInputs): number {
  return i.forfeitedCompensation + i.relocationCost - i.signingBonus;
}

/** Current-job pay you would have earned during the gap. */
export function incomeLostDuringGap(i: JobSwitchInputs): number {
  return earningsBetween(currentPackage(i), i.currentGrowthRate, 0, newJobStart(i));
}

/** Total cost of making the switch, before the new job pays anything. */
export function netSwitchingCost(i: JobSwitchInputs): number {
  return oneTimeNetCost(i) + incomeLostDuringGap(i);
}

/** What the current package would be when the new job starts (after any raises during the gap). */
export function counterfactualPackageAtStart(i: JobSwitchInputs): number {
  return salaryAt(currentPackage(i), i.currentGrowthRate, newJobStart(i));
}

/** First-year pay difference: new package − current package at that time. */
export function annualPackageIncrease(i: JobSwitchInputs): number {
  return newPackage(i) - counterfactualPackageAtStart(i);
}

/** First-year pay difference after the new job's extra yearly costs. */
export function netAnnualGain(i: JobSwitchInputs): number {
  return annualPackageIncrease(i) - i.annualCostChange;
}

/** Cumulative cash of switching minus staying at time t (years from today). */
export function cumulativeAdvantage(i: JobSwitchInputs, t: number): number {
  if (t < 0) return 0;
  const start = newJobStart(i);
  const switchEarnings = earningsBetween(newPackage(i), i.newGrowthRate, 0, t - start);
  const extraCosts = i.annualCostChange * Math.max(0, t - start);
  const stayEarnings = earningsBetween(currentPackage(i), i.currentGrowthRate, 0, t);
  return -oneTimeNetCost(i) + switchEarnings - extraCosts - stayEarnings;
}

/** Every time in [0, end] where A(t) can change slope: raise dates on both paths and the start date. */
export function advantageBreakpoints(i: JobSwitchInputs, end: number): number[] {
  const start = newJobStart(i);
  const points = [start];
  for (let k = 1; k <= Math.ceil(end); k++) points.push(k);
  for (let k = 1; start + k <= end; k++) points.push(start + k);
  return points;
}

/**
 * Break-even: the time after which switching stays ahead of staying for the
 * rest of the horizon. A temporary lead (e.g. from a large signing bonus) that
 * is later lost does not count.
 */
export function breakEven(
  i: JobSwitchInputs,
  horizonYears: number = JOB_SWITCH_MODEL_CONSTANTS.breakEvenHorizonYears,
): JobSwitchBreakEven {
  const t = stableNonNegativeFrom((x) => cumulativeAdvantage(i, x), advantageBreakpoints(i, horizonYears), 0, horizonYears);
  return t === null ? { reached: false, years: null, horizonYears } : { reached: true, years: t, horizonYears };
}

/** Cumulative net position of switching vs. staying, `years` from today. */
export function impactAfter(i: JobSwitchInputs, years: number): number {
  return cumulativeAdvantage(i, years);
}

export function buildTimeline(
  i: JobSwitchInputs,
  horizonYears: number = JOB_SWITCH_MODEL_CONSTANTS.timelineYears,
  stepsPerYear: number = JOB_SWITCH_MODEL_CONSTANTS.timelineStepsPerYear,
): TimelinePoint[] {
  const times = new Set<number>();
  for (let s = 0; s <= horizonYears * stepsPerYear; s++) times.add(round6(s / stepsPerYear));
  times.add(round6(newJobStart(i)));
  return [...times]
    .filter((t) => t <= horizonYears)
    .sort((a, b) => a - b)
    .map((t) => ({ t, advantage: cumulativeAdvantage(i, t) }));
}

const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

// ---------------------------------------------------------------------------
// Assumptions (rendered verbatim in the UI)
// ---------------------------------------------------------------------------

export function describeAssumptions(i: JobSwitchInputs): Assumption[] {
  return [
    {
      id: "nominal-pretax",
      label: "Money is nominal and pre-tax",
      unit: "text",
      detail: "Figures are not adjusted for inflation, taxes or the time value of money. Enter after-tax amounts for a take-home view.",
    },
    {
      id: "package",
      label: "Whole packages grow at each job's raise rate",
      unit: "text",
      detail: "Salary, bonus and benefits are added together and rise once a year: from today if you stay, from your start date if you switch. Bonuses are treated as earned evenly through the year.",
    },
    {
      id: "one-time-today",
      label: "One-time items happen today",
      value: oneTimeNetCost(i),
      unit: "currency",
      detail: "Compensation left behind, moving costs and the signing bonus are all counted at the moment you switch. Positive means a net cost.",
    },
    {
      id: "gap",
      label: "Unpaid gap before the new job",
      value: i.gapMonths,
      unit: "months",
      detail: "You earn nothing during the gap, while the stay path keeps earning.",
    },
    {
      id: "counterfactual",
      label: "Current package when the new job starts",
      value: counterfactualPackageAtStart(i),
      unit: "currency",
      detail: "The pay increase is measured against this figure, including any raise you'd get during the gap.",
    },
    {
      id: "extra-costs",
      label: "Extra yearly costs of the new job",
      value: i.annualCostChange,
      unit: "currency",
      detail: "Applied every year from your start date, without growth.",
    },
    {
      id: "horizon",
      label: "Break-even search horizon",
      value: JOB_SWITCH_MODEL_CONSTANTS.breakEvenHorizonYears,
      unit: "years",
      detail: "If switching isn't permanently ahead within this many years, it's reported as not breaking even.",
    },
    {
      id: "non-financial",
      label: "Only financial effects are modelled",
      unit: "text",
      detail: "Job security, learning, title, team, stress and work-life balance matter but are excluded from the numbers.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Runs the full Job Switch model.
 * @throws RangeError if the inputs fail validation.
 */
export function calculateJobSwitch(inputs: JobSwitchInputs): JobSwitchResult {
  const validation = validateJobSwitchInputs(inputs);
  if (!validation.valid) throw new RangeError(`Invalid inputs: ${Object.values(validation.errors).join(" ")}`);

  const cost = netSwitchingCost(inputs);
  const impact5 = impactAfter(inputs, 5);
  return {
    inputs: { ...inputs },
    currentPackage: currentPackage(inputs),
    newPackage: newPackage(inputs),
    counterfactualPackageAtStart: counterfactualPackageAtStart(inputs),
    annualPackageIncrease: annualPackageIncrease(inputs),
    netAnnualGain: netAnnualGain(inputs),
    oneTimeNetCost: oneTimeNetCost(inputs),
    incomeLostDuringGap: incomeLostDuringGap(inputs),
    netSwitchingCost: cost,
    breakEven: breakEven(inputs),
    impact1Year: impactAfter(inputs, 1),
    impact3Year: impactAfter(inputs, 3),
    impact5Year: impact5,
    return5Year: cost > 0 ? impact5 / cost : null,
    timeline: buildTimeline(inputs),
    assumptions: describeAssumptions(inputs),
  };
}
