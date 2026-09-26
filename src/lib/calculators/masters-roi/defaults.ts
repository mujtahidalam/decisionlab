import type { MastersRoiInputs } from "./types";

/**
 * Illustrative starting values shown on first load. They are placeholders for
 * users to overwrite, not statistical averages.
 */
export const DEFAULT_INPUTS: Readonly<MastersRoiInputs> = Object.freeze({
  currentSalary: 55_000,
  postDegreeSalary: 75_000,
  tuition: 40_000,
  livingExpenses: 18_000,
  scholarship: 10_000,
  studyDurationYears: 2,
  salaryGrowthRate: 0.03,
  jobSearchMonths: 0,
});

/** Model constants — surfaced in the assumptions list and methodology. */
export const MODEL_CONSTANTS = Object.freeze({
  /** How far after graduation we look for a break-even point. */
  breakEvenHorizonYears: 50,
  /** Horizons for the headline impact figures (years after graduation). */
  shortHorizonYears: 5,
  longHorizonYears: 10,
  /** Timeline sampling resolution (points per year). */
  timelineStepsPerYear: 12,
});
