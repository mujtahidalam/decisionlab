import { describe, expect, it } from "vitest";
import { JOB_SWITCH_DEFAULT_INPUTS } from "./defaults";
import {
  annualPackageIncrease,
  breakEven,
  calculateJobSwitch,
  counterfactualPackageAtStart,
  cumulativeAdvantage,
  currentPackage,
  describeAssumptions,
  incomeLostDuringGap,
  netAnnualGain,
  netSwitchingCost,
  newPackage,
  oneTimeNetCost,
} from "./engine";
import type { JobSwitchInputs } from "./types";

const D = JOB_SWITCH_DEFAULT_INPUTS;

/**
 * Hand-checked default case:
 *   current package 60,000 + 5,000 + 4,000 = 69,000 (3%/yr)
 *   new package     72,000 + 6,000 + 5,000 = 83,000 (4%/yr), extra costs 2,400/yr
 *   one-time net    8,000 + 3,000 − 5,000  = 6,000
 *   gap 1 month → income lost 69,000 / 12  = 5,750  → switching cost 11,750
 */
describe("building blocks (default inputs)", () => {
  it("packages", () => {
    expect(currentPackage(D)).toBe(69_000);
    expect(newPackage(D)).toBe(83_000);
  });

  it("switching costs", () => {
    expect(oneTimeNetCost(D)).toBe(6_000);
    expect(incomeLostDuringGap(D)).toBeCloseTo(5_750, 8);
    expect(netSwitchingCost(D)).toBeCloseTo(11_750, 8);
  });

  it("annual gain", () => {
    expect(counterfactualPackageAtStart(D)).toBe(69_000);
    expect(annualPackageIncrease(D)).toBe(14_000);
    expect(netAnnualGain(D)).toBe(11_600);
  });

  it("cumulative advantage at key times", () => {
    expect(cumulativeAdvantage(D, 0)).toBe(-6_000);
    expect(cumulativeAdvantage(D, 1 / 12)).toBeCloseTo(-11_750, 8);
    // t = 1: 83,000 × 11/12 − 2,400 × 11/12 − 69,000 − 6,000
    expect(cumulativeAdvantage(D, 1)).toBeCloseTo(-1_116.6667, 3);
    // t = 3: new 83,000 + 86,320 + 89,772.8 × 11/12; stay 69,000 + 71,070 + 73,202.1; costs 7,000
    expect(cumulativeAdvantage(D, 3)).toBeCloseTo(25_339.6333, 3);
  });

  it("break-even is solved exactly across raise dates", () => {
    // A(13/12) = −322.5; slope afterwards 86,320 − 2,400 − 71,070 = 12,850/yr
    const be = breakEven(D);
    expect(be.reached).toBe(true);
    expect(be.years!).toBeCloseTo(13 / 12 + 322.5 / 12_850, 10);
  });
});

describe("calculateJobSwitch", () => {
  it("returns every headline metric", () => {
    const r = calculateJobSwitch(D);
    expect(r.netSwitchingCost).toBeCloseTo(11_750, 8);
    expect(r.impact1Year).toBeCloseTo(-1_116.6667, 3);
    expect(r.impact3Year).toBeCloseTo(25_339.6333, 3);
    expect(r.return5Year).toBeCloseTo(r.impact5Year / 11_750, 12);
    expect(r.timeline[0]).toEqual({ t: 0, advantage: -6_000 });
    expect(r.timeline.at(-1)!.t).toBe(5);
    expect(r.timeline.at(-1)!.advantage).toBeCloseTo(r.impact5Year, 8);
  });

  it("is deterministic and doesn't mutate its input", () => {
    const input = { ...D };
    expect(calculateJobSwitch(input)).toEqual(calculateJobSwitch(input));
    expect(input).toEqual(D);
  });

  it("throws on invalid inputs", () => {
    expect(() => calculateJobSwitch({ ...D, newSalary: -1 })).toThrow(RangeError);
    expect(() => calculateJobSwitch({ ...D, gapMonths: Number.NaN })).toThrow(RangeError);
  });

  it("lists its assumptions", () => {
    expect(describeAssumptions(D).map((a) => a.id)).toEqual(
      expect.arrayContaining(["nominal-pretax", "package", "one-time-today", "gap", "counterfactual", "extra-costs", "horizon"]),
    );
  });
});

describe("edge cases", () => {
  const simple: JobSwitchInputs = {
    currentSalary: 60_000, currentBonus: 0, currentBenefits: 0, currentGrowthRate: 0,
    newSalary: 70_000, newBonus: 0, newBenefits: 0, newGrowthRate: 0,
    signingBonus: 0, forfeitedCompensation: 0, relocationCost: 0, gapMonths: 0, annualCostChange: 0,
  };

  it("a costless raise breaks even immediately", () => {
    const r = calculateJobSwitch(simple);
    expect(r.breakEven).toMatchObject({ reached: true, years: 0 });
    expect(r.netSwitchingCost).toBe(0);
    expect(r.return5Year).toBeNull();
    expect(r.impact5Year).toBeCloseTo(50_000, 8);
  });

  it("a signing bonus that hides a pay cut does not count as break-even", () => {
    // +30,000 today, then −9,000 per year: ahead for 3⅓ years, behind for good after that.
    const i = { ...simple, newSalary: 51_000, signingBonus: 30_000 };
    const r = calculateJobSwitch(i);
    expect(r.impact1Year).toBeCloseTo(21_000, 8);
    expect(r.impact5Year).toBeCloseTo(-15_000, 8);
    expect(r.breakEven.reached).toBe(false);
  });

  it("a temporary lead followed by a later overtake reports the final crossing", () => {
    // +5,000 today; year 1 pays 6,000 less (A = −1,000), year 2 pays 600 less (A = −1,600),
    // year 3 pays 5,340 more → switching overtakes for good at t = 2 + 1,600 / 5,340.
    const i = { ...simple, newSalary: 54_000, newGrowthRate: 0.1, signingBonus: 5_000 };
    expect(cumulativeAdvantage(i, 0)).toBe(5_000);
    expect(cumulativeAdvantage(i, 2)).toBeCloseTo(-1_600, 8);
    const be = breakEven(i);
    expect(be.years!).toBeCloseTo(2 + 1_600 / 5_340, 10);
    for (let t = be.years!; t <= 20; t += 0.25) expect(cumulativeAdvantage(i, t)).toBeGreaterThanOrEqual(-1e-6);
  });

  it("a signing bonus that more than covers a temporary pay dip counts as immediate", () => {
    const i = { ...simple, newSalary: 54_000, newGrowthRate: 0.1, signingBonus: 10_000 };
    expect(breakEven(i)).toMatchObject({ reached: true, years: 0 });
  });

  it("counts a raise that would have happened during a long gap", () => {
    const i = { ...simple, currentGrowthRate: 0.05, gapMonths: 18 };
    expect(counterfactualPackageAtStart(i)).toBeCloseTo(63_000, 8);
    expect(incomeLostDuringGap(i)).toBeCloseTo(60_000 + 0.5 * 63_000, 8);
  });

  it("treats negative extra costs as yearly savings", () => {
    const i = { ...simple, annualCostChange: -3_000 };
    expect(netAnnualGain(i)).toBe(13_000);
    expect(calculateJobSwitch(i).impact3Year).toBeCloseTo(39_000, 8);
  });

  it("never breaks even when switching is always worse", () => {
    expect(breakEven({ ...simple, newSalary: 50_000 }).reached).toBe(false);
  });
});
