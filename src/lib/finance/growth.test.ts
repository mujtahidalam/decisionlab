import { describe, expect, it } from "vitest";
import { cumulativeEarnings, earningsBetween, salaryAt } from "./growth";

/** Closed-form geometric series: b·((1+g)^n − 1)/g, or b·n when g = 0. */
const geometric = (b: number, g: number, n: number) =>
  g === 0 ? b * n : (b * (Math.pow(1 + g, n) - 1)) / g;

describe("salaryAt", () => {
  it("applies growth once per completed year", () => {
    expect(salaryAt(50_000, 0.03, 0)).toBe(50_000);
    expect(salaryAt(50_000, 0.03, 0.99)).toBe(50_000);
    expect(salaryAt(50_000, 0.03, 1)).toBeCloseTo(51_500, 8);
    expect(salaryAt(50_000, 0.03, 2.5)).toBeCloseTo(53_045, 8);
  });

  it("returns 0 before the job starts", () => {
    expect(salaryAt(50_000, 0.03, -0.5)).toBe(0);
  });

  it("handles zero and negative growth", () => {
    expect(salaryAt(40_000, 0, 7)).toBe(40_000);
    expect(salaryAt(40_000, -0.1, 2)).toBeCloseTo(32_400, 8);
  });

  it("rejects invalid numbers", () => {
    expect(() => salaryAt(Number.NaN, 0.03, 1)).toThrow(RangeError);
    expect(() => salaryAt(1, Number.POSITIVE_INFINITY, 1)).toThrow(RangeError);
    expect(() => salaryAt(1, -1, 1)).toThrow(RangeError);
  });
});

describe("earningsBetween", () => {
  it("integrates whole and partial years exactly", () => {
    // Year 0 at 50,000 plus half of year 1 at 55,000.
    expect(earningsBetween(50_000, 0.1, 0, 1.5)).toBeCloseTo(77_500, 8);
    // Half of year 0 (50) + year 1 (110) + quarter of year 2 (0.25 × 121).
    expect(earningsBetween(100, 0.1, 0.5, 2.25)).toBeCloseTo(190.25, 10);
  });

  it("matches the geometric-series closed form for whole years", () => {
    for (const [b, g, n] of [
      [55_000, 0.03, 2],
      [70_000, 0.05, 5],
      [1_000, -0.02, 10],
      [80_000, 0, 7],
    ] as const) {
      expect(earningsBetween(b, g, 0, n)).toBeCloseTo(geometric(b, g, n), 6);
    }
  });

  it("ignores time before the job starts", () => {
    expect(earningsBetween(100, 0, -1, 1)).toBe(100);
    expect(earningsBetween(100, 0, -3, -1)).toBe(0);
  });

  it("returns 0 for empty or reversed intervals", () => {
    expect(earningsBetween(100, 0.05, 2, 2)).toBe(0);
    expect(earningsBetween(100, 0.05, 3, 1)).toBe(0);
  });

  it("is additive over adjacent intervals", () => {
    const whole = earningsBetween(60_000, 0.04, 0.3, 6.8);
    const parts = earningsBetween(60_000, 0.04, 0.3, 2.7) + earningsBetween(60_000, 0.04, 2.7, 6.8);
    expect(parts).toBeCloseTo(whole, 8);
  });

  it("rejects invalid numbers", () => {
    expect(() => earningsBetween(1, 0, 0, Number.NaN)).toThrow(RangeError);
    expect(() => earningsBetween(1, -1.5, 0, 1)).toThrow(RangeError);
  });
});

describe("cumulativeEarnings", () => {
  it("sums from the start of the job", () => {
    expect(cumulativeEarnings(55_000, 0.03, 2)).toBeCloseTo(111_650, 8);
    expect(cumulativeEarnings(55_000, 0.03, 0)).toBe(0);
  });
});
