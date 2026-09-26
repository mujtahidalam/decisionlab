/**
 * Golden values, boundary inputs and known-issue regression tests for the
 * Master's ROI engine. Complements engine.test.ts (unit examples) and
 * engine.properties.test.ts (invariants over generated inputs).
 */

import { describe, expect, it } from "vitest";
import { breakEven, calculateMastersRoi, cumulativeAdvantage } from "./engine";
import { DEFAULT_INPUTS } from "./defaults";
import { expectClose } from "./test-utils";
import type { MastersRoiInputs } from "./types";

const geometric = (b: number, g: number, n: number) => (g === 0 ? b * n : (b * (Math.pow(1 + g, n) - 1)) / g);

// ---------------------------------------------------------------------------
// Golden values: the default inputs shown on first page load.
// Every figure is re-derived here from closed-form formulas, so an accidental
// model change shows up as a precise, explainable diff.
// ---------------------------------------------------------------------------
describe("golden values for the default inputs", () => {
  const r = calculateMastersRoi(DEFAULT_INPUTS);
  // S0 = 55,000  P0 = 75,000  tuition 40,000  living 18,000/yr  scholarship 10,000  D = 2  g = 3%

  it("costs", () => {
    expect(r.totalLivingCost).toBe(36_000); // 18,000 × 2
    expect(r.totalEducationCost).toBe(66_000); // 40,000 + 36,000 − 10,000
    expectClose(r.opportunityCost, 111_650); // 55,000 + 56,650
    expectClose(r.netInvestment, 177_650);
  });

  it("income increase", () => {
    expectClose(r.counterfactualSalaryAtStart, 58_349.5); // 55,000 × 1.03²
    expectClose(r.annualIncomeIncrease, 16_650.5);
  });

  it("5- and 10-year impact", () => {
    const g = 0.03;
    const impact5 = geometric(75_000, g, 5) - 66_000 - geometric(55_000, g, 7);
    const impact10 = geometric(75_000, g, 10) - 66_000 - geometric(55_000, g, 12);
    expectClose(r.impact5Year, impact5);
    expectClose(r.impact10Year, impact10);
    expect(r.impact5Year).toBeCloseTo(-89_250.23, 2);
    expect(r.impact10Year).toBeCloseTo(13_229.32, 2);
    expectClose(r.return10Year!, impact10 / 177_650);
  });

  it("break-even", () => {
    expect(r.breakEven.reached).toBe(true);
    expect(r.breakEven.yearsAfterGraduation!).toBeCloseTo(9.391058881, 8);
    expect(r.breakEven.yearsFromStart!).toBeCloseTo(11.391058881, 8);
  });
});

// ---------------------------------------------------------------------------
// Boundary inputs (field minimums/maximums and degenerate combinations)
// ---------------------------------------------------------------------------
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

describe("boundary inputs", () => {
  it("shortest program (3 months)", () => {
    const r = calculateMastersRoi({ ...flat, studyDurationYears: 0.25 });
    expect(r.opportunityCost).toBe(12_500); // 50,000 × 0.25
    expect(r.totalEducationCost).toBe(28_750); // 30,000 + 3,750 − 5,000
    expect(r.breakEven.yearsAfterGraduation!).toBeCloseTo(41_250 / 20_000, 10);
  });

  it("longest program (6 years) at maximum growth (25%) stays finite", () => {
    const r = calculateMastersRoi({ ...flat, studyDurationYears: 6, salaryGrowthRate: 0.25, jobSearchMonths: 24 });
    expect(Number.isFinite(r.impact10Year)).toBe(true);
    expect(r.timeline.at(-1)!.t).toBe(16);
  });

  it("minimum growth (−10%) shrinks the premium each year", () => {
    const i = { ...flat, salaryGrowthRate: -0.1 };
    const r = calculateMastersRoi(i);
    // Premium in each post-graduation year = (70,000 × 0.9^k) − (50,000 × 0.9^(k+2))
    const expected10 = geometric(70_000, -0.1, 10) - 55_000 - geometric(50_000, -0.1, 12);
    expectClose(r.impact10Year, expected10);
  });

  it("zero salaries on both paths: impact is just the education cost", () => {
    const r = calculateMastersRoi({ ...flat, currentSalary: 0, postDegreeSalary: 0 });
    expect(r.opportunityCost).toBe(0);
    expect(r.impact5Year).toBeCloseTo(-55_000, 8);
    expect(r.impact10Year).toBeCloseTo(-55_000, 8);
    expect(r.breakEven.reached).toBe(false);
  });

  it("free program while not working: no investment, immediate break-even", () => {
    const r = calculateMastersRoi({ ...flat, currentSalary: 0, tuition: 0, livingExpenses: 0, scholarship: 0 });
    expect(r.netInvestment).toBe(0);
    expect(r.breakEven).toMatchObject({ reached: true, yearsAfterGraduation: 0 });
    expect(r.return10Year).toBeNull();
    expect(r.impact10Year).toBeCloseTo(700_000, 8);
  });

  it("very large amounts keep full precision", () => {
    const k = 1_000; // salaries up to 70,000,000
    const big = { ...flat, currentSalary: 50_000 * k, postDegreeSalary: 70_000 * k, tuition: 30_000 * k, livingExpenses: 15_000 * k, scholarship: 5_000 * k };
    const r = calculateMastersRoi(big);
    expectClose(r.impact10Year, 45_000 * k);
    expect(r.breakEven.yearsAfterGraduation!).toBeCloseTo(7.75, 10);
  });

  it("break-even exactly at, just inside and just outside the 50-year horizon", () => {
    // Constant premium 20,000/yr; tune the investment through tuition.
    const withInvestment = (net: number) => ({ ...flat, tuition: net - 100_000 - 30_000 + 5_000 });
    expect(breakEven(withInvestment(20_000 * 49.5)).yearsAfterGraduation!).toBeCloseTo(49.5, 9);
    expect(breakEven(withInvestment(20_000 * 50)).yearsAfterGraduation!).toBeCloseTo(50, 9);
    expect(breakEven(withInvestment(20_000 * 50.5)).reached).toBe(false);
  });

  it("job search longer than the 5-year window still counts all costs", () => {
    const r = calculateMastersRoi({ ...flat, jobSearchMonths: 24 });
    // New job starts 2 years after graduation: 3 years of premium by year 5.
    expect(r.impact5Year).toBeCloseTo(3 * 70_000 - 55_000 - 7 * 50_000, 8);
  });

  it("fractional duration with a job search: break-even solved between non-integer raise dates", () => {
    const i = { ...flat, studyDurationYears: 1.75, salaryGrowthRate: 0.04, jobSearchMonths: 5 };
    const be = breakEven(i);
    expect(be.reached).toBe(true);
    expect(Math.abs(cumulativeAdvantage(i, be.yearsFromStart!))).toBeLessThan(1e-6);
  });
});

// ---------------------------------------------------------------------------
// Known issues found in code review. These use `it.fails`: they pass while the
// bug exists and will start failing once it is fixed — at which point switch
// them to plain `it` so they guard against regressions.
// ---------------------------------------------------------------------------
describe("known issues (expected to fail until fixed)", () => {
  // Funding exceeds costs (net investment < 0) but the post-degree salary is
  // lower than the salary you'd have without the degree. The engine reports
  // "breaks even immediately" even though the degree falls behind within years.
  const fundedButLowerPay: MastersRoiInputs = {
    ...DEFAULT_INPUTS,
    currentSalary: 40_000,
    postDegreeSalary: 30_000,
    scholarship: 200_000,
  };

  it.fails("does not report break-even when the degree ends up behind at 10 years with a negative premium", () => {
    const r = calculateMastersRoi(fundedButLowerPay);
    expect(r.annualIncomeIncrease).toBeLessThan(0);
    expect(r.impact10Year).toBeLessThan(0);
    expect(r.breakEven.reached).toBe(false);
  });
});
