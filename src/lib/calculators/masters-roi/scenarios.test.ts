import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "./defaults";
import { applyScenario, clampToField, runScenarios, SCENARIOS } from "./scenarios";
import type { MastersRoiInputs } from "./types";

const base: MastersRoiInputs = {
  currentSalary: 50_000,
  postDegreeSalary: 70_000,
  tuition: 30_000,
  livingExpenses: 15_000,
  scholarship: 5_000,
  studyDurationYears: 2,
  salaryGrowthRate: 0.03,
  jobSearchMonths: 0,
};

const byId = (id: string) => SCENARIOS.find((s) => s.id === id)!;

describe("scenario definitions", () => {
  it("defines optimistic, expected and conservative in that order", () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual(["optimistic", "expected", "conservative"]);
  });

  it("gives every adjustment a description", () => {
    for (const s of SCENARIOS) for (const a of s.adjustments) expect(a.description.length).toBeGreaterThan(0);
  });
});

describe("applyScenario", () => {
  it("leaves inputs unchanged for the expected scenario", () => {
    expect(applyScenario(base, byId("expected"))).toEqual(base);
  });

  it("applies optimistic adjustments", () => {
    const o = applyScenario(base, byId("optimistic"));
    expect(o.postDegreeSalary).toBeCloseTo(77_000, 8);
    expect(o.salaryGrowthRate).toBeCloseTo(0.04, 12);
    expect(o.livingExpenses).toBeCloseTo(14_250, 8);
    expect(o.tuition).toBe(base.tuition);
  });

  it("applies conservative adjustments", () => {
    const c = applyScenario(base, byId("conservative"));
    expect(c.postDegreeSalary).toBeCloseTo(59_500, 8);
    expect(c.salaryGrowthRate).toBeCloseTo(0.02, 12);
    expect(c.livingExpenses).toBeCloseTo(16_500, 8);
    expect(c.jobSearchMonths).toBe(3);
  });

  it("clamps adjusted values to the field bounds", () => {
    const c = applyScenario({ ...base, salaryGrowthRate: -0.1, jobSearchMonths: 23 }, byId("conservative"));
    expect(c.salaryGrowthRate).toBeCloseTo(-0.1, 12);
    expect(c.jobSearchMonths).toBe(24);
  });

  it("does not mutate the input", () => {
    const input = { ...base };
    applyScenario(input, byId("optimistic"));
    expect(input).toEqual(base);
  });
});

describe("clampToField", () => {
  it("converts percent bounds to model units", () => {
    expect(clampToField("salaryGrowthRate", 0.5)).toBeCloseTo(0.25, 12);
    expect(clampToField("salaryGrowthRate", -0.5)).toBeCloseTo(-0.1, 12);
    expect(clampToField("tuition", -10)).toBe(0);
  });
});

describe("runScenarios", () => {
  it("orders outcomes optimistic ≥ expected ≥ conservative for a typical case", () => {
    const [o, e, c] = runScenarios(DEFAULT_INPUTS);
    expect(o!.result.impact10Year).toBeGreaterThan(e!.result.impact10Year);
    expect(e!.result.impact10Year).toBeGreaterThan(c!.result.impact10Year);
    expect(o!.result.breakEven.yearsAfterGraduation!).toBeLessThan(e!.result.breakEven.yearsAfterGraduation!);
  });

  it("uses the unmodified inputs for the expected scenario", () => {
    const expected = runScenarios(base)[1]!;
    expect(expected.inputs).toEqual(base);
  });
});
