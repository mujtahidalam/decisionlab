/** Property tests for the Job Switch engine over 300 seeded, generated inputs. */

import { describe, expect, it } from "vitest";
import {
  advantageBreakpoints,
  breakEven,
  calculateJobSwitch,
  cumulativeAdvantage,
  impactAfter,
  netSwitchingCost,
  newJobStart,
  newPackage,
} from "./engine";
import { expectClose, generateJobSwitchInputs, referenceAdvantage } from "./test-utils";
import type { JobSwitchInputs } from "./types";
import { validateJobSwitchInputs } from "./validation";

const CASES = generateJobSwitchInputs(300);

function forAll(check: (i: JobSwitchInputs) => void): void {
  for (const i of CASES) {
    try {
      check(i);
    } catch (err) {
      throw new Error(`${(err as Error).message}\nInputs: ${JSON.stringify(i)}`);
    }
  }
}

describe("generated inputs", () => {
  it("are all valid", () => forAll((i) => expect(validateJobSwitchInputs(i).valid).toBe(true)));
});

describe("accounting identities", () => {
  it("the advantage when the new job starts equals minus the switching cost", () => {
    forAll((i) => expectClose(cumulativeAdvantage(i, newJobStart(i)), -netSwitchingCost(i), 1e-9, 1e-4));
  });

  it("matches an independent reference implementation", () => {
    forAll((i) => {
      for (let k = 0; k <= 40; k++) {
        const t = (6 * k) / 40;
        expectClose(cumulativeAdvantage(i, t), referenceAdvantage(i, t), 1e-9, 1e-4);
      }
    });
  });
});

describe("exact linear effects of one-time items", () => {
  it("each extra 1,000 of signing bonus raises every impact by exactly 1,000", () => {
    forAll((i) => {
      const more = { ...i, signingBonus: i.signingBonus + 1_000 };
      for (const y of [1, 3, 5]) expectClose(impactAfter(more, y), impactAfter(i, y) + 1_000, 1e-9, 1e-4);
    });
  });

  it("each extra 1,000 left behind or spent on moving lowers every impact by exactly 1,000", () => {
    forAll((i) => {
      const a = { ...i, forfeitedCompensation: i.forfeitedCompensation + 1_000 };
      const b = { ...i, relocationCost: i.relocationCost + 1_000 };
      expectClose(impactAfter(a, 3), impactAfter(i, 3) - 1_000, 1e-9, 1e-4);
      expectClose(impactAfter(b, 3), impactAfter(i, 3) - 1_000, 1e-9, 1e-4);
    });
  });
});

describe("direction of effects", () => {
  it("a higher new salary never lowers the impact; a higher current salary never raises it", () => {
    forAll((i) => {
      expect(impactAfter({ ...i, newSalary: i.newSalary + 5_000 }, 5)).toBeGreaterThanOrEqual(impactAfter(i, 5) - 1e-6);
      expect(impactAfter({ ...i, currentSalary: i.currentSalary + 5_000 }, 5)).toBeLessThanOrEqual(impactAfter(i, 5) + 1e-6);
    });
  });

  it("a longer gap never helps when the new job's pay always exceeds its extra costs", () => {
    forAll((i) => {
      const minPay = newPackage(i) * Math.pow(1 + Math.min(i.newGrowthRate, 0), 6);
      if (minPay < i.annualCostChange) return;
      expect(impactAfter({ ...i, gapMonths: i.gapMonths + 3 }, 5)).toBeLessThanOrEqual(impactAfter(i, 5) + 1e-6);
    });
  });
});

describe("scale invariance", () => {
  it("multiplying every amount by k scales money results by k and leaves break-even unchanged", () => {
    const k = 117.5;
    forAll((i) => {
      const s: JobSwitchInputs = {
        ...i,
        currentSalary: i.currentSalary * k, currentBonus: i.currentBonus * k, currentBenefits: i.currentBenefits * k,
        newSalary: i.newSalary * k, newBonus: i.newBonus * k, newBenefits: i.newBenefits * k,
        signingBonus: i.signingBonus * k, forfeitedCompensation: i.forfeitedCompensation * k,
        relocationCost: i.relocationCost * k, annualCostChange: i.annualCostChange * k,
      };
      const a = calculateJobSwitch(i);
      const b = calculateJobSwitch(s);
      expectClose(b.impact5Year, a.impact5Year * k, 1e-9, 1e-3);
      expect(b.breakEven.reached).toBe(a.breakEven.reached);
      if (a.breakEven.reached) expectClose(b.breakEven.years!, a.breakEven.years!, 1e-7, 1e-7);
    });
  });
});

describe("break-even", () => {
  it("when reached, switching is ahead at every slope change from then on, and behind just before", () => {
    forAll((i) => {
      const be = breakEven(i);
      if (!be.reached) return;
      const y = be.years!;
      const scale = Math.max(1, Math.abs(netSwitchingCost(i)), newPackage(i));
      for (const t of [y, ...advantageBreakpoints(i, be.horizonYears).filter((p) => p > y), be.horizonYears]) {
        expect(cumulativeAdvantage(i, t) / scale).toBeGreaterThanOrEqual(-1e-9);
      }
      if (y > 0) expect(cumulativeAdvantage(i, y - 1e-3)).toBeLessThan(0);
    });
  });

  it("when not reached, switching is behind at the end of the horizon", () => {
    forAll((i) => {
      const be = breakEven(i);
      if (!be.reached) expect(cumulativeAdvantage(i, be.horizonYears)).toBeLessThan(0);
    });
  });

  it("is never reported while the 5-year impact is negative and break-even lies within 5 years", () => {
    forAll((i) => {
      const be = breakEven(i);
      if (be.reached && be.years! <= 5) expect(impactAfter(i, 5)).toBeGreaterThanOrEqual(-1e-6);
    });
  });
});

describe("full result", () => {
  it("contains only finite numbers and a sorted timeline", () => {
    forAll((i) => {
      const r = calculateJobSwitch(i);
      for (const v of [r.netSwitchingCost, r.netAnnualGain, r.impact1Year, r.impact3Year, r.impact5Year]) expect(Number.isFinite(v)).toBe(true);
      for (let k = 1; k < r.timeline.length; k++) expect(r.timeline[k]!.t).toBeGreaterThan(r.timeline[k - 1]!.t);
    });
  });
});
