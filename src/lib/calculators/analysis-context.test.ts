/**
 * The AI layer must not change any calculation. These tests pin the engines'
 * outputs and prove the analysis context carries exactly those numbers.
 */

import { describe, expect, it } from "vitest";
import { buildJobSwitchAnalysisContext } from "./job-switch-roi/analysis-context";
import { JOB_SWITCH_DEFAULT_INPUTS } from "./job-switch-roi/defaults";
import { calculateJobSwitch } from "./job-switch-roi/engine";
import { buildMastersRoiAnalysisContext } from "./masters-roi/analysis-context";
import { DEFAULT_INPUTS } from "./masters-roi/defaults";
import { calculateMastersRoi } from "./masters-roi/engine";
import { getCalculatorDefinition } from "./definitions";
import { influenceLevel } from "./framework/analysis-context";

const value = (ctx: { results: { name: string; value: string }[] }, name: string) => ctx.results.find((r) => r.name === name)?.value;

describe("engines are unchanged by the AI layer", () => {
  it("Master's ROI golden values", () => {
    const before = calculateMastersRoi(DEFAULT_INPUTS);
    buildMastersRoiAnalysisContext({ ...DEFAULT_INPUTS }, "USD");
    const after = calculateMastersRoi(DEFAULT_INPUTS);
    expect(after).toEqual(before);
    expect(after.netInvestment).toBeCloseTo(177_650, 8);
    expect(after.impact10Year).toBeCloseTo(13_229.32, 2);
    expect(after.breakEven.yearsAfterGraduation!).toBeCloseTo(9.391058881, 8);
  });

  it("Job Switch golden values", () => {
    const r = calculateJobSwitch(JOB_SWITCH_DEFAULT_INPUTS);
    buildJobSwitchAnalysisContext({ ...JOB_SWITCH_DEFAULT_INPUTS }, "USD");
    expect(calculateJobSwitch(JOB_SWITCH_DEFAULT_INPUTS)).toEqual(r);
    expect(r.netSwitchingCost).toBeCloseTo(11_750, 8);
  });

  it("building a context does not mutate the inputs", () => {
    const inputs = { ...DEFAULT_INPUTS };
    buildMastersRoiAnalysisContext(inputs, "EUR");
    expect(inputs).toEqual(DEFAULT_INPUTS);
  });
});

describe("Master's ROI analysis context", () => {
  const ctx = buildMastersRoiAnalysisContext({ ...DEFAULT_INPUTS }, "USD");

  it("carries the engine's numbers, formatted exactly as the UI shows them", () => {
    expect(value(ctx, "Net investment")).toBe("$177,650");
    expect(value(ctx, "Opportunity cost (salary given up)")).toBe("$111,650");
    expect(value(ctx, "Break-even period")).toBe("9 years 5 months after graduation");
    expect(value(ctx, "10-year impact after graduation")).toBe("+$13,229");
    expect(ctx.inputs).toContainEqual({ name: "Expected annual salary growth", value: "3%" });
  });

  it("includes all three scenarios with their adjustments", () => {
    expect(ctx.scenarios.map((s) => s.name)).toEqual(["Optimistic", "Expected", "Conservative"]);
    expect(ctx.scenarios[2]!.changes).toContain("3 extra months of job search");
  });

  it("ranks sensitivity with deterministic influence levels", () => {
    expect(ctx.sensitivity.rows[0]).toMatchObject({ input: "Expected post-degree annual salary", influence: "high" });
    expect(ctx.sensitivity.rows.every((r) => ["high", "medium", "low"].includes(r.influence))).toBe(true);
  });

  it("includes assumptions and warnings but no free text from the user", () => {
    expect(ctx.assumptions.length).toBeGreaterThan(5);
    expect(ctx.warnings).toEqual([]);
    expect(Object.keys(ctx).sort()).toEqual(
      ["assumptions", "calculatorName", "calculatorType", "currency", "formulaVersion", "inputs", "results", "scenarios", "sensitivity", "warnings"].sort(),
    );
  });

  it("formats in the requested currency without changing values", () => {
    const bdt = buildMastersRoiAnalysisContext({ ...DEFAULT_INPUTS }, "BDT");
    expect(value(bdt, "Net investment")!.replace(/\s/g, " ")).toBe("BDT 1,77,650");
  });
});

describe("definitions", () => {
  it("expose context builders and accept snake_case ids", () => {
    expect(getCalculatorDefinition("masters_roi")?.buildAnalysisContext).toBeTypeOf("function");
    expect(getCalculatorDefinition("job-switch-roi")?.buildAnalysisContext).toBeTypeOf("function");
    expect(getCalculatorDefinition("rent_vs_buy")).toBeUndefined();
  });

  it("classify influence relative to the largest swing", () => {
    expect([influenceLevel(100, 100), influenceLevel(30, 100), influenceLevel(10, 100), influenceLevel(0, 0)]).toEqual(["high", "medium", "low", "low"]);
  });
});
