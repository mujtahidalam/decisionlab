import { describe, expect, it } from "vitest";
import { calculateMastersRoi } from "./engine";
import { analyseSensitivity, SENSITIVITY_VARIATIONS } from "./sensitivity";
import type { MastersRoiInputs } from "./types";

/** Zero growth keeps every sensitivity swing hand-checkable. */
const flat: MastersRoiInputs = {
  currentSalary: 50_000,
  postDegreeSalary: 70_000,
  tuition: 30_000,
  livingExpenses: 15_000,
  scholarship: 5_000,
  studyDurationYears: 2,
  salaryGrowthRate: 0,
  jobSearchMonths: 0,
};

describe("analyseSensitivity", () => {
  const analysis = analyseSensitivity(flat);
  const row = (id: string) => analysis.rows.find((r) => r.id === id)!;

  it("uses the unmodified result as its baseline", () => {
    expect(analysis.baseline).toBeCloseTo(calculateMastersRoi(flat).impact10Year, 8);
    expect(analysis.metricLabel).toBe("10-year financial impact");
  });

  it("tests every configured input exactly once", () => {
    expect(analysis.rows.map((r) => r.id).sort()).toEqual(SENSITIVITY_VARIATIONS.map((v) => v.key).sort());
  });

  it("sorts rows by descending swing", () => {
    for (let k = 1; k < analysis.rows.length; k++) {
      expect(analysis.rows[k - 1]!.swing).toBeGreaterThanOrEqual(analysis.rows[k]!.swing);
    }
  });

  it("computes cost swings exactly (±20% of tuition moves impact by ∓6,000)", () => {
    const t = row("tuition");
    expect(t.lowInput).toBeCloseTo(24_000, 8);
    expect(t.highInput).toBeCloseTo(36_000, 8);
    expect(t.lowOutcome).toBeCloseTo(45_000 + 6_000, 6);
    expect(t.highOutcome).toBeCloseTo(45_000 - 6_000, 6);
    expect(t.swing).toBeCloseTo(12_000, 6);
  });

  it("computes post-degree salary swing exactly (±14,000/yr over 10 years)", () => {
    expect(row("postDegreeSalary").swing).toBeCloseTo(2 * 14_000 * 10, 6);
  });

  it("computes current salary swing (opportunity cost + 10 years of forgone premium)", () => {
    // ±10,000/yr over 12 years of the no-degree path → swing 240,000
    expect(row("currentSalary").swing).toBeCloseTo(240_000, 6);
  });

  it("clamps variations to valid ranges", () => {
    const js = row("jobSearchMonths");
    expect(js.lowInput).toBe(0);
    expect(js.highInput).toBe(3);
    expect(js.lowOutcome).toBeCloseTo(analysis.baseline, 8);
  });

  it("gives zero swing to inputs that are zero under a percentage variation", () => {
    const a = analyseSensitivity({ ...flat, scholarship: 0 });
    expect(a.rows.find((r) => r.id === "scholarship")!.swing).toBe(0);
  });

  it("can analyse the 5-year metric", () => {
    const five = analyseSensitivity(flat, "impact5Year");
    expect(five.baseline).toBeCloseTo(-55_000, 8);
    expect(five.metricLabel).toBe("5-year financial impact");
  });
});
