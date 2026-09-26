import { describe, expect, it } from "vitest";
import {
  advantageBreakpoints,
  annualIncomeIncrease,
  breakEven,
  buildTimeline,
  calculateMastersRoi,
  counterfactualSalaryAtStart,
  cumulativeAdvantage,
  describeAssumptions,
  educationCostPaidBy,
  impactAfterGraduation,
  netInvestment,
  opportunityCost,
  postDegreeEmploymentStart,
  totalEducationCost,
  totalLivingCost,
} from "./engine";
import type { MastersRoiInputs } from "./types";

/**
 * Zero-growth fixture: every figure below can be checked by hand.
 *   living = 15,000 × 2 = 30,000
 *   education cost = 30,000 + 30,000 − 5,000 = 55,000
 *   opportunity cost = 50,000 × 2 = 100,000
 *   net investment = 155,000
 *   premium = 70,000 − 50,000 = 20,000 / year
 *   break-even = 155,000 / 20,000 = 7.75 years after graduation
 *   5-year impact = 5 × 20,000 − 155,000 = −55,000
 *   10-year impact = 10 × 20,000 − 155,000 = 45,000
 */
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

const geometric = (b: number, g: number, n: number) =>
  g === 0 ? b * n : (b * (Math.pow(1 + g, n) - 1)) / g;

describe("cost formulas", () => {
  it("computes total living cost as annual expenses × duration", () => {
    expect(totalLivingCost(flat)).toBe(30_000);
    expect(totalLivingCost({ ...flat, studyDurationYears: 1.5 })).toBe(22_500);
  });

  it("computes total education cost as tuition + living − scholarship", () => {
    expect(totalEducationCost(flat)).toBe(55_000);
  });

  it("allows a negative education cost when funding exceeds costs", () => {
    expect(totalEducationCost({ ...flat, scholarship: 80_000 })).toBe(-20_000);
  });

  it("spreads education cost evenly over the study period", () => {
    expect(educationCostPaidBy(flat, 0)).toBe(0);
    expect(educationCostPaidBy(flat, 1)).toBe(27_500);
    expect(educationCostPaidBy(flat, 2)).toBe(55_000);
    expect(educationCostPaidBy(flat, 9)).toBe(55_000);
    expect(educationCostPaidBy(flat, -1)).toBe(0);
  });
});

describe("opportunity cost", () => {
  it("equals forgone salary over the study period", () => {
    expect(opportunityCost(flat)).toBe(100_000);
  });

  it("includes raises the no-degree path would have received", () => {
    // 55,000 + 55,000 × 1.03
    expect(opportunityCost({ ...flat, currentSalary: 55_000, salaryGrowthRate: 0.03 })).toBeCloseTo(111_650, 8);
  });

  it("handles fractional durations exactly", () => {
    // 100,000 + 0.5 × 110,000
    const i = { ...flat, currentSalary: 100_000, salaryGrowthRate: 0.1, studyDurationYears: 1.5 };
    expect(opportunityCost(i)).toBeCloseTo(155_000, 8);
  });

  it("extends through the job-search period", () => {
    expect(postDegreeEmploymentStart({ ...flat, jobSearchMonths: 6 })).toBe(2.5);
    expect(opportunityCost({ ...flat, jobSearchMonths: 6 })).toBe(125_000);
  });

  it("is zero when not currently working", () => {
    expect(opportunityCost({ ...flat, currentSalary: 0 })).toBe(0);
  });
});

describe("net investment", () => {
  it("adds education cost and opportunity cost", () => {
    expect(netInvestment(flat)).toBe(155_000);
    expect(netInvestment({ ...flat, jobSearchMonths: 6 })).toBe(180_000);
  });
});

describe("annual income increase", () => {
  it("is the post-degree salary minus the current salary when growth is zero", () => {
    expect(counterfactualSalaryAtStart(flat)).toBe(50_000);
    expect(annualIncomeIncrease(flat)).toBe(20_000);
  });

  it("compares against the no-degree salary at the time the new job starts", () => {
    const i = { ...flat, salaryGrowthRate: 0.05 };
    expect(counterfactualSalaryAtStart(i)).toBeCloseTo(55_125, 8); // 50,000 × 1.05²
    expect(annualIncomeIncrease(i)).toBeCloseTo(14_875, 8);
  });

  it("can be negative", () => {
    expect(annualIncomeIncrease({ ...flat, postDegreeSalary: 40_000 })).toBe(-10_000);
  });
});

describe("cumulative advantage", () => {
  it("starts at zero and equals −net investment when the new job starts", () => {
    expect(cumulativeAdvantage(flat, 0)).toBe(0);
    expect(cumulativeAdvantage(flat, 2)).toBeCloseTo(-155_000, 8);
    const js = { ...flat, jobSearchMonths: 6 };
    expect(cumulativeAdvantage(js, postDegreeEmploymentStart(js))).toBeCloseTo(-180_000, 8);
  });

  it("matches a closed-form calculation with salary growth", () => {
    const i = { ...flat, salaryGrowthRate: 0.05 };
    const t = 7; // five years after a two-year program
    const expected = geometric(70_000, 0.05, 5) - 55_000 - geometric(50_000, 0.05, 7);
    expect(cumulativeAdvantage(i, t)).toBeCloseTo(expected, 6);
    expect(expected).toBeCloseTo(-75_306.2352, 3);
  });

  it("lists every slope change as a breakpoint", () => {
    const pts = advantageBreakpoints({ ...flat, jobSearchMonths: 6 }, 5);
    expect(pts).toEqual(expect.arrayContaining([2, 2.5, 1, 3, 4, 5, 3.5, 4.5]));
  });
});

describe("impact after graduation", () => {
  it("computes 5- and 10-year impacts including all costs", () => {
    expect(impactAfterGraduation(flat, 5)).toBeCloseTo(-55_000, 8);
    expect(impactAfterGraduation(flat, 10)).toBeCloseTo(45_000, 8);
  });

  it("counts job-search months against the post-graduation window", () => {
    // Premium runs for 4.5 of the 5 years; opportunity cost is 125,000.
    const js = { ...flat, jobSearchMonths: 6 };
    expect(impactAfterGraduation(js, 5)).toBeCloseTo(4.5 * 70_000 - 55_000 - 7 * 50_000, 8);
  });
});

describe("break-even", () => {
  it("is exact for a constant premium", () => {
    const be = breakEven(flat);
    expect(be.reached).toBe(true);
    expect(be.yearsAfterGraduation).toBeCloseTo(7.75, 10);
    expect(be.yearsFromStart).toBeCloseTo(9.75, 10);
  });

  it("accounts for a job search", () => {
    // 180,000 / 20,000 = 9 years of premium, starting 0.5 years after graduation.
    expect(breakEven({ ...flat, jobSearchMonths: 6 }).yearsAfterGraduation).toBeCloseTo(9.5, 10);
  });

  it("lands exactly on the zero crossing with salary growth", () => {
    const i = { ...flat, salaryGrowthRate: 0.04, studyDurationYears: 1.5 };
    const be = breakEven(i);
    expect(be.reached).toBe(true);
    const t = be.yearsFromStart!;
    expect(Math.abs(cumulativeAdvantage(i, t))).toBeLessThan(1e-6);
    expect(cumulativeAdvantage(i, t - 0.01)).toBeLessThan(0);
  });

  it("is immediate when there is nothing to recover", () => {
    const be = breakEven({ ...flat, currentSalary: 0, scholarship: 60_000 });
    expect(be).toMatchObject({ reached: true, yearsAfterGraduation: 0 });
  });

  it("is not reached when there is no salary premium", () => {
    const be = breakEven({ ...flat, postDegreeSalary: 50_000 });
    expect(be).toMatchObject({ reached: false, yearsAfterGraduation: null, yearsFromStart: null });
  });

  it("respects the search horizon", () => {
    // Needs 7.75 years; a 5-year horizon is too short.
    expect(breakEven(flat, 5).reached).toBe(false);
    expect(breakEven(flat, 8).reached).toBe(true);
  });
});

describe("timeline", () => {
  it("runs from program start to 10 years after graduation, sorted", () => {
    const tl = buildTimeline(flat);
    expect(tl[0]).toEqual({ t: 0, advantage: 0 });
    expect(tl.at(-1)!.t).toBe(12);
    expect(tl.at(-1)!.advantage).toBeCloseTo(45_000, 8);
    for (let k = 1; k < tl.length; k++) expect(tl[k]!.t).toBeGreaterThan(tl[k - 1]!.t);
  });

  it("includes graduation and first-paycheck times even off the monthly grid", () => {
    const tl = buildTimeline({ ...flat, studyDurationYears: 1.3, jobSearchMonths: 1 });
    const times = tl.map((p) => p.t);
    expect(times).toContain(1.3);
    expect(times).toContain(Math.round((1.3 + 1 / 12) * 1e6) / 1e6);
  });
});

describe("calculateMastersRoi", () => {
  it("returns every headline metric", () => {
    const r = calculateMastersRoi(flat);
    expect(r.totalEducationCost).toBe(55_000);
    expect(r.totalLivingCost).toBe(30_000);
    expect(r.opportunityCost).toBe(100_000);
    expect(r.netInvestment).toBe(155_000);
    expect(r.annualIncomeIncrease).toBe(20_000);
    expect(r.breakEven.yearsAfterGraduation).toBeCloseTo(7.75, 10);
    expect(r.impact5Year).toBeCloseTo(-55_000, 8);
    expect(r.impact10Year).toBeCloseTo(45_000, 8);
    expect(r.return10Year).toBeCloseTo(45_000 / 155_000, 12);
  });

  it("returns null ROI when there is no net investment", () => {
    expect(calculateMastersRoi({ ...flat, currentSalary: 0, scholarship: 60_000 }).return10Year).toBeNull();
  });

  it("is deterministic and does not mutate its input", () => {
    const input = { ...flat, salaryGrowthRate: 0.035 };
    const copy = { ...input };
    expect(calculateMastersRoi(input)).toEqual(calculateMastersRoi(input));
    expect(input).toEqual(copy);
  });

  it("throws on invalid inputs", () => {
    expect(() => calculateMastersRoi({ ...flat, tuition: -1 })).toThrow(RangeError);
    expect(() => calculateMastersRoi({ ...flat, studyDurationYears: Number.NaN })).toThrow(RangeError);
  });

  it("reports the assumptions it used", () => {
    const ids = describeAssumptions(flat).map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining(["nominal-pretax", "growth", "costs-spread", "opportunity-period", "counterfactual", "horizon"]),
    );
    const counterfactual = describeAssumptions({ ...flat, salaryGrowthRate: 0.05 }).find((a) => a.id === "counterfactual");
    expect(counterfactual?.value).toBeCloseTo(55_125, 8);
  });
});
