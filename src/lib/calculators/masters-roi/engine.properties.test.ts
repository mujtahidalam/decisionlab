/**
 * Property tests for the Master's ROI engine.
 *
 * Each property is checked against a few hundred generated inputs spanning
 * every field's full range. A seeded PRNG keeps the inputs reproducible: if a
 * property fails, the error message includes the exact inputs that broke it.
 */

import { describe, expect, it } from "vitest";
import { earningsBetween } from "../../finance/growth";
import {
  annualIncomeIncrease,
  breakEven,
  buildTimeline,
  calculateMastersRoi,
  cumulativeAdvantage,
  impactAfterGraduation,
  netInvestment,
  opportunityCost,
  postDegreeEmploymentStart,
  totalEducationCost,
} from "./engine";
import { expectClose, generateInputs, referenceAdvantage } from "./test-utils";
import type { MastersRoiInputs } from "./types";
import { validateMastersRoiInputs } from "./validation";

const CASES = generateInputs(300);

/** Runs `check` for every generated case, labelling failures with the inputs. */
function forAll(check: (i: MastersRoiInputs) => void): void {
  for (const i of CASES) {
    try {
      check(i);
    } catch (err) {
      throw new Error(`${(err as Error).message}\nInputs: ${JSON.stringify(i)}`);
    }
  }
}

/** True when the degree's salary is higher at every moment after the new job starts (g ≥ 0). */
function premiumAlwaysPositive(i: MastersRoiInputs): boolean {
  const start = postDegreeEmploymentStart(i);
  return (
    i.salaryGrowthRate >= 0 &&
    i.postDegreeSalary > i.currentSalary * Math.pow(1 + i.salaryGrowthRate, Math.floor(start) + 1)
  );
}

describe("generated inputs", () => {
  it("are all valid, so every property below exercises the real engine", () => {
    forAll((i) => expect(validateMastersRoiInputs(i).valid).toBe(true));
  });
});

describe("accounting identities", () => {
  it("net investment = education cost + opportunity cost", () => {
    forAll((i) => expectClose(netInvestment(i), totalEducationCost(i) + opportunityCost(i)));
  });

  it("cumulative advantage is 0 at program start", () => {
    forAll((i) => expect(cumulativeAdvantage(i, 0)).toBe(0));
  });

  it("cumulative advantage equals −net investment when the new job starts", () => {
    forAll((i) => expectClose(cumulativeAdvantage(i, postDegreeEmploymentStart(i)), -netInvestment(i)));
  });

  it("matches an independent reference implementation at many points in time", () => {
    forAll((i) => {
      const end = i.studyDurationYears + 12;
      for (let k = 0; k <= 40; k++) {
        const t = (end * k) / 40;
        expectClose(cumulativeAdvantage(i, t), referenceAdvantage(i, t), 1e-9, 1e-4);
      }
    });
  });

  it("the change from year 5 to year 10 equals the salary premium earned in between", () => {
    forAll((i) => {
      const d = i.studyDurationYears;
      const j = i.jobSearchMonths / 12;
      const degree = earningsBetween(i.postDegreeSalary, i.salaryGrowthRate, 5 - j, 10 - j);
      const baseline = earningsBetween(i.currentSalary, i.salaryGrowthRate, d + 5, d + 10);
      expectClose(impactAfterGraduation(i, 10) - impactAfterGraduation(i, 5), degree - baseline, 1e-9, 1e-4);
    });
  });

  it("annual income increase is the post-degree salary minus the no-degree salary at that time", () => {
    forAll((i) => {
      const t = postDegreeEmploymentStart(i);
      const counterfactual = i.currentSalary * Math.pow(1 + i.salaryGrowthRate, Math.floor(t));
      expectClose(annualIncomeIncrease(i), i.postDegreeSalary - counterfactual);
    });
  });
});

describe("exact linear sensitivities", () => {
  it("each extra unit of tuition lowers every impact by exactly one unit", () => {
    forAll((i) => {
      const more = { ...i, tuition: i.tuition + 1_000 };
      expectClose(impactAfterGraduation(more, 5), impactAfterGraduation(i, 5) - 1_000, 1e-9, 1e-4);
      expectClose(impactAfterGraduation(more, 10), impactAfterGraduation(i, 10) - 1_000, 1e-9, 1e-4);
    });
  });

  it("each extra unit of scholarship raises every impact by exactly one unit", () => {
    forAll((i) => {
      const more = { ...i, scholarship: i.scholarship + 1_000 };
      expectClose(impactAfterGraduation(more, 10), impactAfterGraduation(i, 10) + 1_000, 1e-9, 1e-4);
    });
  });

  it("each extra unit of annual living cost lowers the impact by the study duration", () => {
    forAll((i) => {
      const more = { ...i, livingExpenses: i.livingExpenses + 1_000 };
      expectClose(impactAfterGraduation(more, 10), impactAfterGraduation(i, 10) - 1_000 * i.studyDurationYears, 1e-9, 1e-4);
    });
  });
});

describe("direction of effects (monotonicity)", () => {
  it("a higher post-degree salary never lowers the 10-year impact", () => {
    forAll((i) => {
      const more = { ...i, postDegreeSalary: i.postDegreeSalary + 5_000 };
      expect(impactAfterGraduation(more, 10)).toBeGreaterThanOrEqual(impactAfterGraduation(i, 10) - 1e-6);
    });
  });

  it("a higher current salary never raises the 10-year impact", () => {
    forAll((i) => {
      const more = { ...i, currentSalary: i.currentSalary + 5_000 };
      expect(impactAfterGraduation(more, 10)).toBeLessThanOrEqual(impactAfterGraduation(i, 10) + 1e-6);
    });
  });

  it("a longer job search never raises the 10-year impact", () => {
    forAll((i) => {
      const longer = { ...i, jobSearchMonths: i.jobSearchMonths + 3 };
      expect(impactAfterGraduation(longer, 10)).toBeLessThanOrEqual(impactAfterGraduation(i, 10) + 1e-6);
    });
  });

  it("a higher post-degree salary never delays break-even", () => {
    forAll((i) => {
      const a = breakEven(i);
      const b = breakEven({ ...i, postDegreeSalary: i.postDegreeSalary + 5_000 });
      if (a.reached) {
        expect(b.reached).toBe(true);
        expect(b.yearsFromStart!).toBeLessThanOrEqual(a.yearsFromStart! + 1e-9);
      }
    });
  });
});

describe("scale invariance (the currency must not matter)", () => {
  it("multiplying every money input by k multiplies money outputs by k and leaves timing unchanged", () => {
    const k = 117.5; // e.g. USD → BDT
    forAll((i) => {
      const scaled: MastersRoiInputs = {
        ...i,
        currentSalary: i.currentSalary * k,
        postDegreeSalary: i.postDegreeSalary * k,
        tuition: i.tuition * k,
        livingExpenses: i.livingExpenses * k,
        scholarship: i.scholarship * k,
      };
      const a = calculateMastersRoi(i);
      const b = calculateMastersRoi(scaled);
      expectClose(b.netInvestment, a.netInvestment * k, 1e-9, 1e-3);
      expectClose(b.impact10Year, a.impact10Year * k, 1e-9, 1e-3);
      expect(b.breakEven.reached).toBe(a.breakEven.reached);
      if (a.breakEven.reached) expectClose(b.breakEven.yearsFromStart!, a.breakEven.yearsFromStart!, 1e-7, 1e-7);
    });
  });
});

describe("break-even", () => {
  it("when reached after a real investment, sits exactly on the zero crossing", () => {
    forAll((i) => {
      const be = breakEven(i);
      if (!be.reached || netInvestment(i) <= 0) return;
      const t = be.yearsFromStart!;
      const scale = Math.max(1, netInvestment(i));
      expect(Math.abs(cumulativeAdvantage(i, t)) / scale).toBeLessThan(1e-9);
      expect(cumulativeAdvantage(i, t - 1e-3)).toBeLessThan(0);
      expect(t).toBeGreaterThanOrEqual(postDegreeEmploymentStart(i));
    });
  });

  it("when not reached, the degree is still behind at the end of the horizon", () => {
    forAll((i) => {
      const be = breakEven(i);
      if (be.reached) return;
      expect(cumulativeAdvantage(i, i.studyDurationYears + be.horizonYears)).toBeLessThan(0);
      expect(be.yearsAfterGraduation).toBeNull();
    });
  });

  it("agrees with the 5- and 10-year impacts whenever the premium is always positive", () => {
    forAll((i) => {
      if (!premiumAlwaysPositive(i) || netInvestment(i) <= 0) return;
      const be = breakEven(i);
      const years = be.yearsAfterGraduation;
      if (impactAfterGraduation(i, 5) >= 0) expect(years!).toBeLessThanOrEqual(5 + 1e-9);
      else expect(years === null || years > 5).toBe(true);
      if (impactAfterGraduation(i, 10) >= 0) expect(years!).toBeLessThanOrEqual(10 + 1e-9);
      else expect(years === null || years > 10).toBe(true);
    });
  });
});

describe("full result", () => {
  it("contains only finite numbers", () => {
    forAll((i) => {
      const r = calculateMastersRoi(i);
      for (const v of [r.totalEducationCost, r.opportunityCost, r.netInvestment, r.annualIncomeIncrease, r.impact5Year, r.impact10Year]) {
        expect(Number.isFinite(v)).toBe(true);
      }
      for (const p of r.timeline) expect(Number.isFinite(p.advantage)).toBe(true);
    });
  });

  it("builds a sorted timeline whose points match the engine and whose last point is the 10-year impact", () => {
    forAll((i) => {
      const tl = buildTimeline(i);
      expect(tl[0]!.t).toBe(0);
      for (let k = 1; k < tl.length; k++) expect(tl[k]!.t).toBeGreaterThan(tl[k - 1]!.t);
      expectClose(tl.at(-1)!.advantage, impactAfterGraduation(i, 10), 1e-9, 1e-4);
      for (let y = 0; y <= 10; y++) {
        const t = Math.round((i.studyDurationYears + y) * 1e6) / 1e6;
        expect(tl.some((p) => p.t === t)).toBe(true);
      }
    });
  });

  it("is deterministic", () => {
    forAll((i) => expect(calculateMastersRoi(i)).toEqual(calculateMastersRoi({ ...i })));
  });
});
