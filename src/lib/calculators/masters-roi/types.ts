/**
 * Data models for the Master's Degree ROI calculator.
 *
 * Conventions:
 *  - Money is a plain number in the user's chosen currency (nominal, pre-tax
 *    unless the user enters after-tax figures). Currency affects formatting only.
 *  - Rates are decimals: 0.03 means 3% per year.
 *  - Time is in years unless the field name says otherwise.
 */

import type { Assumption } from "../types";

export interface MastersRoiInputs {
  /** Current annual salary if you keep working instead of studying. */
  currentSalary: number;
  /** Expected annual starting salary in the first job after graduating. */
  postDegreeSalary: number;
  /** Total tuition and mandatory fees for the whole program. */
  tuition: number;
  /** Living expenses per year of study. */
  livingExpenses: number;
  /** Total scholarship, grant, assistantship or stipend funding for the whole program. */
  scholarship: number;
  /** Program length in years; fractional values (e.g. 1.5) are allowed. */
  studyDurationYears: number;
  /** Expected annual salary growth, applied to both the degree and no-degree paths. */
  salaryGrowthRate: number;
  /** Advanced: months between graduation and the first post-degree paycheck. */
  jobSearchMonths: number;
}

export type MastersRoiInputKey = keyof MastersRoiInputs;

/** A point on the cumulative-advantage curve. */
export interface TimelinePoint {
  /** Years since the program starts. */
  t: number;
  /** Cumulative cash of the degree path minus the no-degree path at time t. */
  advantage: number;
}

export interface BreakEven {
  /** Whether the degree pays back within the search horizon. */
  reached: boolean;
  /** Years from graduation until cumulative advantage turns non-negative. */
  yearsAfterGraduation: number | null;
  /** Years from the program start until break-even. */
  yearsFromStart: number | null;
  /** Search horizon, in years after graduation. */
  horizonYears: number;
}

export interface MastersRoiResult {
  inputs: MastersRoiInputs;

  /** Tuition + living costs over the program − scholarship. */
  totalEducationCost: number;
  /** Living expenses × study duration. */
  totalLivingCost: number;
  /** Salary forgone on the no-degree path until the post-degree job starts. */
  opportunityCost: number;
  /** Total education cost + opportunity cost. */
  netInvestment: number;

  /** No-degree salary you would be earning when the post-degree job starts. */
  counterfactualSalaryAtStart: number;
  /** First-year premium: post-degree salary − counterfactual salary at that time. */
  annualIncomeIncrease: number;

  breakEven: BreakEven;

  /** Cumulative net position 5 years after graduation (all costs included). */
  impact5Year: number;
  /** Cumulative net position 10 years after graduation (all costs included). */
  impact10Year: number;
  /** impact10Year ÷ netInvestment, or null when net investment ≤ 0. */
  return10Year: number | null;

  /** Cumulative advantage sampled monthly from program start to 10 years after graduation. */
  timeline: TimelinePoint[];

  /** Every assumption behind the numbers, for transparent display. */
  assumptions: Assumption[];
}
