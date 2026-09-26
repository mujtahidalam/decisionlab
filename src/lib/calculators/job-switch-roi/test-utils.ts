/** Test helpers for the Job Switch engine. Not imported by application code. */

import { earningsBetween } from "../../finance/growth";
import { seededRandom } from "../masters-roi/test-utils";
import type { JobSwitchInputs } from "./types";

export { expectClose } from "../masters-roi/test-utils";

/** Reproducible, varied, valid inputs spanning every field's range. */
export function generateJobSwitchInputs(count: number, seed = 424242): JobSwitchInputs[] {
  const rand = seededRandom(seed);
  const between = (lo: number, hi: number, step: number) => lo + Math.floor(rand() * ((hi - lo) / step + 1)) * step;
  const maybe = (p: number, v: () => number) => (rand() < p ? 0 : v());
  const out: JobSwitchInputs[] = [];
  for (let n = 0; n < count; n++) {
    out.push({
      currentSalary: between(10_000, 250_000, 500),
      currentBonus: maybe(0.3, () => between(0, 50_000, 500)),
      currentBenefits: maybe(0.3, () => between(0, 30_000, 500)),
      currentGrowthRate: between(-10, 25, 0.5) / 100,
      newSalary: between(10_000, 300_000, 500),
      newBonus: maybe(0.3, () => between(0, 60_000, 500)),
      newBenefits: maybe(0.3, () => between(0, 30_000, 500)),
      newGrowthRate: between(-10, 25, 0.5) / 100,
      signingBonus: maybe(0.4, () => between(0, 80_000, 500)),
      forfeitedCompensation: maybe(0.4, () => between(0, 100_000, 500)),
      relocationCost: maybe(0.5, () => between(0, 20_000, 500)),
      gapMonths: maybe(0.4, () => between(0, 24, 1)),
      annualCostChange: maybe(0.4, () => between(-20_000, 20_000, 500)),
    });
  }
  return out;
}

/** Independent reference implementation of A(t), written from the specification. */
export function referenceAdvantage(i: JobSwitchInputs, t: number): number {
  const start = i.gapMonths / 12;
  const current = i.currentSalary + i.currentBonus + i.currentBenefits;
  const next = i.newSalary + i.newBonus + i.newBenefits;
  const oneTime = i.forfeitedCompensation + i.relocationCost - i.signingBonus;
  const switchCash = t > start ? earningsBetween(next, i.newGrowthRate, 0, t - start) - i.annualCostChange * (t - start) : 0;
  return -oneTime + switchCash - earningsBetween(current, i.currentGrowthRate, 0, t);
}
