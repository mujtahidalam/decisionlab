import { describe, expect, it } from "vitest";
import { firstNonNegative, normaliseBreakpoints, stableNonNegativeFrom } from "./piecewise";

describe("normaliseBreakpoints", () => {
  it("sorts, de-duplicates, clips to range and keeps the endpoints", () => {
    expect(normaliseBreakpoints([5, 2, 2, 12, -1, 3, 3.0000000000001], 0, 10)).toEqual([0, 2, 3, 5, 10]);
  });

  it("drops non-finite values", () => {
    expect(normaliseBreakpoints([Number.NaN, Number.POSITIVE_INFINITY, 4], 0, 8)).toEqual([0, 4, 8]);
  });
});

describe("firstNonNegative", () => {
  it("solves a linear function exactly", () => {
    expect(firstNonNegative((t) => t - 2.5, [], 0, 10)).toBeCloseTo(2.5, 12);
  });

  it("solves inside the correct segment of a piecewise-linear function", () => {
    // slope 2 until t = 3 (f(3) = −4), then slope 5 → root at 3.8
    const f = (t: number) => (t < 3 ? -10 + 2 * t : -4 + 5 * (t - 3));
    expect(firstNonNegative(f, [3], 0, 10)).toBeCloseTo(3.8, 12);
  });

  it("returns the start when the function is already non-negative", () => {
    expect(firstNonNegative((t) => t + 1, [], 2, 5)).toBe(2);
  });

  it("returns null when the function never reaches zero", () => {
    expect(firstNonNegative(() => -1, [1, 2, 3], 0, 10)).toBeNull();
  });

  it("returns null for an empty interval", () => {
    expect(firstNonNegative((t) => t, [], 5, 1)).toBeNull();
  });

  it("finds a root that lands exactly on a breakpoint", () => {
    expect(firstNonNegative((t) => t - 4, [4], 0, 10)).toBeCloseTo(4, 12);
  });
});

describe("stableNonNegativeFrom", () => {
  it("equals the first crossing for a function that turns positive once", () => {
    expect(stableNonNegativeFrom((t) => t - 2.5, [], 0, 10)).toBeCloseTo(2.5, 12);
  });

  it("ignores a temporary lead that is later lost", () => {
    // +5 at t=0, falls to −5 at t=2, recovers through 0 at t=4.5
    const f = (t: number) => (t < 2 ? 5 - 5 * t : -5 + 2 * (t - 2));
    expect(stableNonNegativeFrom(f, [2], 0, 10)).toBeCloseTo(4.5, 12);
  });

  it("returns start when never negative, null when negative at the end", () => {
    expect(stableNonNegativeFrom(() => 1, [3], 0, 10)).toBe(0);
    expect(stableNonNegativeFrom((t) => 5 - t, [], 0, 10)).toBeNull();
    expect(stableNonNegativeFrom((t) => t, [], 5, 1)).toBeNull();
  });
});
