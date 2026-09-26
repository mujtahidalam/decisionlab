/**
 * Data models for the Job Switch ROI calculator.
 *
 * Conventions (same as every DecisionLens calculator):
 *  - Money is a plain number in the user's chosen currency (nominal, pre-tax
 *    unless the user enters after-tax figures). Currency affects formatting only.
 *  - Rates are decimals: 0.03 means 3% per year.
 *  - Time is in years from today (the moment you resign), unless named otherwise.
 */

import type { Assumption } from "../types";

export interface JobSwitchInputs {
  /** Current job: annual base salary. */
  currentSalary: number;
  /** Current job: expected annual cash bonus. */
  currentBonus: number;
  /** Current job: annual value of benefits (retirement match, insurance, allowances). */
  currentBenefits: number;
  /** Current job: expected annual pay growth. */
  currentGrowthRate: number;
  /** New job: annual base salary. */
  newSalary: number;
  /** New job: expected annual cash bonus. */
  newBonus: number;
  /** New job: annual value of benefits. */
  newBenefits: number;
  /** New job: expected annual pay growth. */
  newGrowthRate: number;
  /** One-time signing bonus from the new employer. */
  signingBonus: number;
  /** One-time value left behind by leaving: unvested equity, unpaid bonus, retention payments. */
  forfeitedCompensation: number;
  /** One-time moving costs you pay yourself (after any relocation package). */
  relocationCost: number;
  /** Months without pay between the two jobs (notice period gap, garden leave unpaid, etc.). */
  gapMonths: number;
  /** Extra yearly costs of the new job (commute, higher rent); negative for savings. */
  annualCostChange: number;
}

export type JobSwitchInputKey = keyof JobSwitchInputs;

export interface TimelinePoint {
  /** Years from today. */
  t: number;
  /** Cumulative cash of switching minus staying at time t. */
  advantage: number;
}

export interface JobSwitchBreakEven {
  /** Whether switching is permanently ahead within the horizon. */
  reached: boolean;
  /** Years from today after which switching stays ahead; 0 when it is never behind. */
  years: number | null;
  horizonYears: number;
}

export interface JobSwitchResult {
  inputs: JobSwitchInputs;

  /** Current package: salary + bonus + benefits (first year). */
  currentPackage: number;
  /** New package: salary + bonus + benefits (first year). */
  newPackage: number;
  /** Current package you would be earning when the new job starts (after raises). */
  counterfactualPackageAtStart: number;
  /** New package − counterfactual package at start (first-year pay difference). */
  annualPackageIncrease: number;
  /** annualPackageIncrease − extra annual costs of the new job. */
  netAnnualGain: number;

  /** Forfeited compensation + relocation − signing bonus (can be negative). */
  oneTimeNetCost: number;
  /** Current-job pay given up during the gap between jobs. */
  incomeLostDuringGap: number;
  /** One-time net cost + income lost during the gap. */
  netSwitchingCost: number;

  breakEven: JobSwitchBreakEven;

  /** Cumulative net position of switching vs. staying, N years from today. */
  impact1Year: number;
  impact3Year: number;
  impact5Year: number;
  /** impact5Year ÷ netSwitchingCost, or null when there is no net cost. */
  return5Year: number | null;

  /** Cumulative advantage sampled monthly from today to 5 years out. */
  timeline: TimelinePoint[];
  assumptions: Assumption[];
}
