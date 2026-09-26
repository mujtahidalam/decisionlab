import type { ValidationResult } from "../types";
import { validateBounds } from "../framework/bounds";
import { JOB_SWITCH_FIELDS } from "./fields";
import type { JobSwitchInputKey, JobSwitchInputs } from "./types";

/** Bounds errors block calculation; warnings flag valid inputs likely to surprise the user. */
export function validateJobSwitchInputs(inputs: JobSwitchInputs): ValidationResult<JobSwitchInputKey> {
  const errors = validateBounds(JOB_SWITCH_FIELDS, inputs);
  const valid = Object.keys(errors).length === 0;
  const warnings: string[] = [];

  if (valid) {
    const gapYears = inputs.gapMonths / 12;
    const current = inputs.currentSalary + inputs.currentBonus + inputs.currentBenefits;
    const stayingAtStart = current * Math.pow(1 + inputs.currentGrowthRate, Math.floor(gapYears));
    const newPackage = inputs.newSalary + inputs.newBonus + inputs.newBenefits;
    if (newPackage - inputs.annualCostChange <= stayingAtStart) {
      warnings.push(
        "After extra costs, the new package isn't higher than what you'd earn by staying, so any gain has to come from one-time items or faster raises.",
      );
    }
    if (inputs.currentGrowthRate > 0.1 || inputs.newGrowthRate > 0.1) {
      warnings.push("Raises above 10% per year are rarely sustained for long; consider a lower rate.");
    }
    if (inputs.gapMonths >= 6) {
      warnings.push("A gap of six months or more is costly — double-check whether it's really unpaid.");
    }
  }
  return { valid, errors, warnings };
}
