import type { JobSwitchInputs } from "./types";

/** Illustrative starting values shown on first load — placeholders, not statistics. */
export const JOB_SWITCH_DEFAULT_INPUTS: Readonly<JobSwitchInputs> = Object.freeze({
  currentSalary: 60_000,
  currentBonus: 5_000,
  currentBenefits: 4_000,
  currentGrowthRate: 0.03,
  newSalary: 72_000,
  newBonus: 6_000,
  newBenefits: 5_000,
  newGrowthRate: 0.04,
  signingBonus: 5_000,
  forfeitedCompensation: 8_000,
  relocationCost: 3_000,
  gapMonths: 1,
  annualCostChange: 2_400,
});

export const JOB_SWITCH_MODEL_CONSTANTS = Object.freeze({
  /** How far ahead we look for a break-even point (years from today). */
  breakEvenHorizonYears: 20,
  /** Headline horizons (years from today). */
  horizons: [1, 3, 5] as const,
  /** Chart horizon and resolution. */
  timelineYears: 5,
  timelineStepsPerYear: 12,
});

/** Version of the calculation model; bump when results for the same inputs would change. */
export const JOB_SWITCH_FORMULA_VERSION = "1.0.0";
