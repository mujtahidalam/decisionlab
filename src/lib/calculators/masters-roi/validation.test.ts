import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "./defaults";
import { validateMastersRoiInputs } from "./validation";

describe("validateMastersRoiInputs", () => {
  it("accepts the defaults with no warnings", () => {
    const v = validateMastersRoiInputs(DEFAULT_INPUTS);
    expect(v.valid).toBe(true);
    expect(v.errors).toEqual({});
    expect(v.warnings).toEqual([]);
  });

  it("rejects non-finite numbers", () => {
    const v = validateMastersRoiInputs({ ...DEFAULT_INPUTS, tuition: Number.NaN });
    expect(v.valid).toBe(false);
    expect(v.errors.tuition).toMatch(/must be a number/);
  });

  it("rejects values outside the field bounds", () => {
    expect(validateMastersRoiInputs({ ...DEFAULT_INPUTS, currentSalary: -1 }).errors.currentSalary).toBeDefined();
    expect(validateMastersRoiInputs({ ...DEFAULT_INPUTS, studyDurationYears: 0 }).errors.studyDurationYears).toBeDefined();
    expect(validateMastersRoiInputs({ ...DEFAULT_INPUTS, studyDurationYears: 7 }).errors.studyDurationYears).toBeDefined();
    expect(validateMastersRoiInputs({ ...DEFAULT_INPUTS, jobSearchMonths: 25 }).errors.jobSearchMonths).toBeDefined();
  });

  it("checks percent fields in display units", () => {
    expect(validateMastersRoiInputs({ ...DEFAULT_INPUTS, salaryGrowthRate: 0.25 }).valid).toBe(true);
    expect(validateMastersRoiInputs({ ...DEFAULT_INPUTS, salaryGrowthRate: 0.26 }).valid).toBe(false);
    expect(validateMastersRoiInputs({ ...DEFAULT_INPUTS, salaryGrowthRate: -0.1 }).valid).toBe(true);
    expect(validateMastersRoiInputs({ ...DEFAULT_INPUTS, salaryGrowthRate: -0.11 }).valid).toBe(false);
  });

  it("warns when funding exceeds costs", () => {
    const v = validateMastersRoiInputs({ ...DEFAULT_INPUTS, scholarship: 1_000_000 });
    expect(v.valid).toBe(true);
    expect(v.warnings.some((w) => w.includes("funding exceeds"))).toBe(true);
  });

  it("warns when the post-degree salary is not higher", () => {
    const v = validateMastersRoiInputs({ ...DEFAULT_INPUTS, postDegreeSalary: DEFAULT_INPUTS.currentSalary });
    expect(v.warnings.some((w) => w.includes("not higher"))).toBe(true);
  });

  it("warns about very high salary growth", () => {
    const v = validateMastersRoiInputs({ ...DEFAULT_INPUTS, salaryGrowthRate: 0.15 });
    expect(v.warnings.some((w) => w.includes("10%"))).toBe(true);
  });
});
