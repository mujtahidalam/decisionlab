import { describe, expect, it } from "vitest";
import { DEFAULT_INPUTS } from "./defaults";
import { parseUrlState, serializeUrlState } from "./url-state";

describe("url state", () => {
  it("serialises defaults to an empty query string", () => {
    expect(serializeUrlState({ inputs: { ...DEFAULT_INPUTS }, currency: "USD" })).toBe("");
  });

  it("round-trips non-default values", () => {
    const state = {
      inputs: { ...DEFAULT_INPUTS, tuition: 12_345, salaryGrowthRate: 0.045, studyDurationYears: 1.5 },
      currency: "BDT" as const,
    };
    const qs = serializeUrlState(state);
    expect(qs).toContain("tu=12345");
    expect(qs).toContain("cur=BDT");
    expect(parseUrlState(new URLSearchParams(qs))).toEqual(state);
  });

  it("falls back to defaults for missing, invalid or out-of-range values", () => {
    const parsed = parseUrlState(new URLSearchParams("tu=abc&cs=-5&g=0.9&d=&ps=90000&cur=XYZ"));
    expect(parsed.inputs).toEqual({ ...DEFAULT_INPUTS, postDegreeSalary: 90_000 });
    expect(parsed.currency).toBe("USD");
  });
});
