/**
 * Test helpers for the Master's ROI engine. Not imported by application code.
 *
 * `generateInputs` produces a reproducible spread of valid inputs covering the
 * full field ranges (a seeded PRNG, so failures always reproduce exactly).
 */

import { earningsBetween } from "../../finance/growth";
import type { MastersRoiInputs } from "./types";

/** mulberry32: tiny, fast, deterministic PRNG returning values in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generates `count` valid, varied inputs (within every field's bounds). */
export function generateInputs(count: number, seed = 20260926): MastersRoiInputs[] {
  const rand = seededRandom(seed);
  const between = (lo: number, hi: number, step: number) => lo + Math.floor(rand() * ((hi - lo) / step + 1)) * step;
  const out: MastersRoiInputs[] = [];
  for (let n = 0; n < count; n++) {
    out.push({
      currentSalary: rand() < 0.1 ? 0 : between(5_000, 250_000, 500),
      postDegreeSalary: between(5_000, 350_000, 500),
      tuition: rand() < 0.1 ? 0 : between(1_000, 150_000, 500),
      livingExpenses: rand() < 0.1 ? 0 : between(1_000, 60_000, 500),
      scholarship: rand() < 0.3 ? 0 : between(0, 120_000, 500),
      studyDurationYears: between(0.25, 6, 0.25),
      salaryGrowthRate: between(-10, 25, 0.5) / 100,
      jobSearchMonths: rand() < 0.4 ? 0 : between(0, 24, 1),
    });
  }
  return out;
}

/**
 * Independent reference implementation of the cumulative advantage A(t),
 * written directly from the specification in docs/ARCHITECTURE.md §5 rather
 * than reusing the engine's helpers, so the two can be cross-checked.
 */
export function referenceAdvantage(i: MastersRoiInputs, t: number): number {
  const d = i.studyDurationYears;
  const start = d + i.jobSearchMonths / 12;
  const educationCost = i.tuition + i.livingExpenses * d - i.scholarship;
  const costPaid = educationCost * Math.min(Math.max(t, 0), d) / d;
  const degreeEarnings = t > start ? earningsBetween(i.postDegreeSalary, i.salaryGrowthRate, 0, t - start) : 0;
  const baselineEarnings = earningsBetween(i.currentSalary, i.salaryGrowthRate, 0, t);
  return degreeEarnings - costPaid - baselineEarnings;
}

/** Relative-or-absolute closeness check suited to money values of any scale. */
export function expectClose(actual: number, expected: number, relTol = 1e-9, absTol = 1e-6): void {
  const diff = Math.abs(actual - expected);
  const limit = Math.max(absTol, relTol * Math.max(Math.abs(actual), Math.abs(expected)));
  if (!(diff <= limit)) {
    throw new Error(`Expected ${actual} to be within ${limit} of ${expected} (diff ${diff}).`);
  }
}
