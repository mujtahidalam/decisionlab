import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "./defaults";
import { parseMastersRoiInputs } from "./input-parsing";

describe("parseMastersRoiInputs", () => {
  it("accepts a complete, valid object", () => {
    expect(parseMastersRoiInputs({ ...DEFAULT_INPUTS })).toEqual({ ok: true, inputs: { ...DEFAULT_INPUTS }, warnings: [] });
  });

  it("rejects non-objects", () => {
    for (const raw of [null, 42, "x", [1]]) expect(parseMastersRoiInputs(raw).ok).toBe(false);
  });

  it("rejects missing, unknown and non-numeric fields", () => {
    const { tuition: _omit, ...missing } = DEFAULT_INPUTS;
    const r = parseMastersRoiInputs({ ...missing, bogus: 1, currentSalary: "55000", scholarship: Number.NaN });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(["bogus", "currentSalary", "scholarship", "tuition"]);
  });

  it("applies the same range validation as the UI", () => {
    const r = parseMastersRoiInputs({ ...DEFAULT_INPUTS, studyDurationYears: 10 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.studyDurationYears).toBeDefined();
  });

  it("passes warnings through", () => {
    const r = parseMastersRoiInputs({ ...DEFAULT_INPUTS, salaryGrowthRate: 0.15 });
    expect(r.ok && r.warnings.length).toBe(1);
  });
});
