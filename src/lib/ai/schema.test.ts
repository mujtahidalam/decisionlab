import { describe, expect, it } from "vitest";
import { DECISION_ANALYSIS_JSON_SCHEMA, MAX_ITEMS_PER_LIST, MAX_STRING_LENGTH, validateDecisionAnalysis } from "./schema";
import { validAnalysis } from "./test-fixtures";

describe("validateDecisionAnalysis", () => {
  it("accepts a well-formed analysis and trims strings", () => {
    const a = { ...validAnalysis(), summary: "  padded  " };
    const r = validateDecisionAnalysis(a);
    expect(r.ok && r.value.summary).toBe("padded");
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["a string", "{}"],
  ])("rejects %s", (_label, raw) => {
    expect(validateDecisionAnalysis(raw).ok).toBe(false);
  });

  it("rejects missing, empty or wrongly typed fields", () => {
    const { risks: _r, ...missing } = validAnalysis();
    expect(validateDecisionAnalysis(missing).ok).toBe(false);
    expect(validateDecisionAnalysis({ ...validAnalysis(), summary: "" }).ok).toBe(false);
    expect(validateDecisionAnalysis({ ...validAnalysis(), key_drivers: [] }).ok).toBe(false);
    expect(validateDecisionAnalysis({ ...validAnalysis(), risks: "one risk" }).ok).toBe(false);
    expect(validateDecisionAnalysis({ ...validAnalysis(), sensitivity: [42] }).ok).toBe(false);
  });

  it("rejects unexpected fields", () => {
    const r = validateDecisionAnalysis({ ...validAnalysis(), recommendation: "Do it" });
    expect(r).toMatchObject({ ok: false });
  });

  it("rejects over-long strings and caps list length", () => {
    expect(validateDecisionAnalysis({ ...validAnalysis(), summary: "x".repeat(MAX_STRING_LENGTH + 1) }).ok).toBe(false);
    const many = Array.from({ length: 10 }, (_, i) => `Question ${i}?`);
    const r = validateDecisionAnalysis({ ...validAnalysis(), questions_to_consider: many });
    expect(r.ok && r.value.questions_to_consider).toHaveLength(MAX_ITEMS_PER_LIST);
  });

  it("publishes a strict-mode compatible JSON schema", () => {
    expect(DECISION_ANALYSIS_JSON_SCHEMA.additionalProperties).toBe(false);
    expect([...DECISION_ANALYSIS_JSON_SCHEMA.required].sort()).toEqual(Object.keys(DECISION_ANALYSIS_JSON_SCHEMA.properties).sort());
  });
});
