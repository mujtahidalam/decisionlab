import { describe, expect, it } from "vitest";
import { allowedQuantities, checkNumbers, extractQuantities } from "./numeric-guard";
import { defaultContext, validAnalysis } from "./test-fixtures";

describe("extractQuantities", () => {
  it("recognises durations, percentages and plain numbers with separators", () => {
    expect(extractQuantities("−$177,650 over 9 years 5 months at 3.5%, or 1,62,260; a 10-year view; 6 months.")).toEqual([
      "num:177650",
      "dur:9y5m",
      "pct:3.5",
      "num:162260",
      "num:10",
      "dur:0y6m",
    ]);
    expect(extractQuantities("2 years and 3 months, 1 year")).toEqual(["dur:2y3m", "dur:1y0m"]);
  });
});

describe("numeric guard", () => {
  const context = defaultContext();

  it("allows every quantity the calculator produced", () => {
    const allowed = allowedQuantities(context);
    for (const q of ["num:177650", "num:111650", "num:13229", "num:128267", "dur:9y5m", "pct:3"]) expect(allowed.has(q)).toBe(true);
  });

  it("passes an analysis that only quotes calculator numbers", () => {
    expect(checkNumbers(validAnalysis(), context)).toEqual({ ok: true, unexpected: [] });
  });

  it("rejects recalculated, rounded or invented numbers", () => {
    const recalculated = { ...validAnalysis(), summary: "You would need about 12 years and $180,000 to break even." };
    expect(checkNumbers(recalculated, context)).toMatchObject({ ok: false, unexpected: expect.arrayContaining(["dur:12y0m", "num:180000"]) });

    const rounded = { ...validAnalysis(), risks: ["The net investment is roughly $178K."] };
    expect(checkNumbers(rounded, context).ok).toBe(false);

    const invented = { ...validAnalysis(), questions_to_consider: ["Salaries in your field grew 7.3% last year — will that continue?"] };
    expect(checkNumbers(invented, context).ok).toBe(false);
  });

  it("rejects a small invented duration even when its digits occur elsewhere in the data", () => {
    const shortened = { ...validAnalysis(), summary: "Break-even takes about 7 years." };
    expect(checkNumbers(shortened, context)).toMatchObject({ ok: false, unexpected: ["dur:7y0m"] });
    // "6 years 10 months" is a real scenario break-even, but "6 years" alone is not.
    const truncated = { ...validAnalysis(), summary: "In the best case it pays back in 6 years." };
    expect(checkNumbers(truncated, context).ok).toBe(false);
  });
});
