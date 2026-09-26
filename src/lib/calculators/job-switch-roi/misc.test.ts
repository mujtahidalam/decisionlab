import { describe, expect, it } from "vitest";
import { JOB_SWITCH_DEFAULT_INPUTS as D, JOB_SWITCH_FORMULA_VERSION } from "./defaults";
import { JOB_SWITCH_FIELDS } from "./fields";
import { parseJobSwitchInputs } from "./input-parsing";
import { buildJobSwitchSessionResults } from "./session-results";
import { jobSwitchUrlCodec } from "./url-state";
import { validateJobSwitchInputs } from "./validation";

describe("fields", () => {
  it("define every input exactly once with defaults inside the bounds", () => {
    expect(JOB_SWITCH_FIELDS.map((f) => f.key).sort()).toEqual(Object.keys(D).sort());
    expect(validateJobSwitchInputs(D)).toEqual({ valid: true, errors: {}, warnings: [] });
  });
});

describe("validation", () => {
  it("allows negative extra costs (savings) but not negative salaries", () => {
    expect(validateJobSwitchInputs({ ...D, annualCostChange: -5_000 }).valid).toBe(true);
    expect(validateJobSwitchInputs({ ...D, newSalary: -1 }).errors.newSalary).toMatch(/between/);
  });

  it("warns when the new package doesn't beat staying after extra costs", () => {
    const v = validateJobSwitchInputs({ ...D, newSalary: 60_000, annualCostChange: 10_000 });
    expect(v.warnings.some((w) => w.includes("isn't higher"))).toBe(true);
  });

  it("warns about long gaps and very high raises", () => {
    expect(validateJobSwitchInputs({ ...D, gapMonths: 6 }).warnings).toHaveLength(1);
    expect(validateJobSwitchInputs({ ...D, newGrowthRate: 0.15 }).warnings).toHaveLength(1);
  });
});

describe("URL state", () => {
  it("round-trips non-default values and omits defaults", () => {
    expect(jobSwitchUrlCodec.serialize({ inputs: { ...D }, currency: "USD" })).toBe("");
    const state = { inputs: { ...D, newSalary: 80_000, annualCostChange: -1_200, newGrowthRate: 0.055 }, currency: "EUR" as const };
    expect(jobSwitchUrlCodec.parse(new URLSearchParams(jobSwitchUrlCodec.serialize(state)))).toEqual(state);
  });

  it("ignores invalid values", () => {
    expect(jobSwitchUrlCodec.parse(new URLSearchParams("ns=abc&gap=99&cg=0.9")).inputs).toEqual(D);
  });
});

describe("input parsing", () => {
  it("accepts complete inputs and rejects unknown or missing keys", () => {
    expect(parseJobSwitchInputs({ ...D }).ok).toBe(true);
    const { newSalary: _n, ...missing } = D;
    const r = parseJobSwitchInputs({ ...missing, bogus: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["bogus", "newSalary"]);
  });
});

describe("session results", () => {
  it("stores headline metrics for all three scenarios with the formula version", () => {
    const s = buildJobSwitchSessionResults(D);
    expect(s.formulaVersion).toBe(JOB_SWITCH_FORMULA_VERSION);
    expect(Object.keys(s.scenarios)).toEqual(["optimistic", "expected", "conservative"]);
    expect(s.scenarios.expected.netSwitchingCost).toBeCloseTo(11_750, 8);
    expect(s.scenarios.expected).not.toHaveProperty("timeline");
  });
});
