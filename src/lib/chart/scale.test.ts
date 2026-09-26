import { describe, expect, it } from "vitest";
import { linearScale, niceTicks } from "./scale";

describe("linearScale", () => {
  it("maps domain to range, including inverted ranges", () => {
    const s = linearScale(0, 10, 100, 0);
    expect(s(0)).toBe(100);
    expect(s(5)).toBe(50);
    expect(s(10)).toBe(0);
  });

  it("does not divide by zero on an empty domain", () => {
    expect(linearScale(3, 3, 0, 10)(3)).toBe(0);
  });
});

describe("niceTicks", () => {
  it("produces round steps covering the range and including zero", () => {
    expect(niceTicks(-180_000, 120_000, 5)).toEqual([-200_000, -100_000, 0, 100_000, 200_000]);
    expect(niceTicks(0, 12, 6)).toEqual([0, 2, 4, 6, 8, 10, 12]);
  });

  it("handles flat and reversed ranges", () => {
    expect(niceTicks(5, 5).length).toBeGreaterThan(1);
    expect(niceTicks(10, 0, 5)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it("returns [0] for non-finite input", () => {
    expect(niceTicks(Number.NaN, 1)).toEqual([0]);
  });
});
