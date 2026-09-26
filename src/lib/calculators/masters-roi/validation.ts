import type { ValidationResult } from "../types";
import { validateBounds } from "../framework/bounds";
import { MASTERS_ROI_FIELDS } from "./fields";
import type { MastersRoiInputKey, MastersRoiInputs } from "./types";

/**
 * Validates inputs against the field bounds in `fields.ts`.
 *
 * - **Errors** make the inputs unusable (non-numeric, out of range) and block calculation.
 * - **Warnings** flag inputs that are valid but likely to surprise the user.
 */
export function validateMastersRoiInputs(
  inputs: MastersRoiInputs,
): ValidationResult<MastersRoiInputKey> {
  const errors = validateBounds(MASTERS_ROI_FIELDS, inputs);

  const warnings: string[] = [];
  const valid = Object.keys(errors).length === 0;

  if (valid) {
    const fundedCosts = inputs.tuition + inputs.livingExpenses * inputs.studyDurationYears;
    if (inputs.scholarship > fundedCosts) {
      warnings.push(
        "Your funding exceeds tuition plus living costs, so the education cost is negative (you receive net income while studying).",
      );
    }
    if (inputs.postDegreeSalary <= inputs.currentSalary) {
      warnings.push(
        "Your expected post-degree salary is not higher than your current salary, so the degree is unlikely to pay back financially.",
      );
    }
    if (inputs.salaryGrowthRate > 0.1) {
      warnings.push(
        "Salary growth above 10% per year is rarely sustained for a decade or more; consider a lower rate.",
      );
    }
  }

  return { valid, errors, warnings };
}
