import { describe, expect, it } from "vitest";
import { JOB_SWITCH_DEFAULT_INPUTS as D } from "./defaults";
import { impactAfter } from "./engine";
import { JOB_SWITCH_SCENARIOS, runJobSwitchScenarios } from "./scenarios";
import { analyseJobSwitchSensitivity, JOB_SWITCH_SENSITIVITY_VARIATIONS } from "./sensitivity";

describe("scenarios", () => {
  it("are optimistic, expected, conservative", () => {
    expect(JOB_SWITCH_SCENARIOS.map((s) => s.id)).toEqual(["optimistic", "expected", "conservative"]);
  });

  it("apply their adjustments to the new-job inputs", () => {
    const [o, e, c] = runJobSwitchScenarios(D);
    expect(o!.inputs).toMatchObject({ newBonus: 7_500, gapMonths: 0 });
    expect(o!.inputs.newGrowthRate).toBeCloseTo(0.05, 12);
    expect(e!.inputs).toEqual(D);
    expect(c!.inputs).toMatchObject({ newBonus: 3_000, gapMonths: 3, relocationCost: 3_750 });
    expect(c!.inputs.newGrowthRate).toBeCloseTo(0.03, 12);
    expect(c!.inputs.currentSalary).toBe(D.currentSalary); // the current job is never adjusted
  });

  it("clamps the gap at zero", () => {
    const [o] = runJobSwitchScenarios({ ...D, gapMonths: 0 });
    expect(o!.inputs.gapMonths).toBe(0);
  });

  it("rank outcomes optimistic ≥ expected ≥ conservative for the defaults", () => {
    const [o, e, c] = runJobSwitchScenarios(D).map((s) => s.result.impact5Year);
    expect(o!).toBeGreaterThan(e!);
    expect(e!).toBeGreaterThan(c!);
  });
});

describe("sensitivity", () => {
  const a = analyseJobSwitchSensitivity(D);

  it("uses the 5-year impact as baseline", () => {
    expect(a.baseline).toBeCloseTo(impactAfter(D, 5), 8);
    expect(a.metricLabel).toBe("5-year financial impact");
  });

  it("tests every configured input once, sorted by swing", () => {
    expect(a.rows).toHaveLength(JOB_SWITCH_SENSITIVITY_VARIATIONS.length);
    for (let k = 1; k < a.rows.length; k++) expect(a.rows[k - 1]!.swing).toBeGreaterThanOrEqual(a.rows[k]!.swing);
  });

  it("computes one-time swings exactly (±50% of a 5,000 signing bonus → 5,000 swing)", () => {
    expect(a.rows.find((r) => r.id === "signingBonus")!.swing).toBeCloseTo(5_000, 6);
    expect(a.rows.find((r) => r.id === "forfeitedCompensation")!.swing).toBeCloseTo(8_000, 6);
  });

  it("clamps the gap variation at zero months", () => {
    const row = a.rows.find((r) => r.id === "gapMonths")!;
    expect(row.lowInput).toBe(0);
    expect(row.highInput).toBe(3);
  });
});
