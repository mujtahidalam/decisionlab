/**
 * Exact root finding for piecewise-linear functions.
 *
 * Many personal-finance quantities (cumulative cash under step-growth salaries,
 * evenly spread costs) are piecewise linear in time: linear between known
 * "breakpoints" where a rate changes. For such functions the first crossing of
 * zero can be found *exactly* by evaluating the function at the breakpoints and
 * linearly interpolating inside the first bracketing segment — no iteration,
 * no tolerance, no approximation.
 */

/** Tolerance used only to absorb floating-point noise when comparing to zero. */
export const EPSILON = 1e-9;

/**
 * Returns the sorted, de-duplicated list of breakpoints inside [start, end],
 * always including `start` and `end` themselves.
 */
export function normaliseBreakpoints(points: number[], start: number, end: number): number[] {
  const inRange = points.filter((p) => Number.isFinite(p) && p > start && p < end);
  const all = [start, ...inRange, end].sort((a, b) => a - b);
  const unique: number[] = [];
  for (const p of all) {
    const last = unique[unique.length - 1];
    if (last === undefined || p - last > EPSILON) unique.push(p);
  }
  return unique;
}

/**
 * Finds the smallest t in [start, end] with f(t) ≥ 0, assuming f is linear
 * between consecutive breakpoints. Returns `null` if f stays negative on the
 * whole interval.
 *
 * @param f            the piecewise-linear function
 * @param breakpoints  every point where f's slope may change (extra points are harmless)
 */
export function firstNonNegative(
  f: (t: number) => number,
  breakpoints: number[],
  start: number,
  end: number,
): number | null {
  if (end < start) return null;
  const points = normaliseBreakpoints(breakpoints, start, end);

  let prevT = points[0]!;
  let prevV = f(prevT);
  if (prevV >= -EPSILON) return prevT;

  for (let i = 1; i < points.length; i++) {
    const t = points[i]!;
    const v = f(t);
    if (v >= -EPSILON) {
      // f is linear on [prevT, t]; solve prevV + (v - prevV)·s = 0 for s ∈ (0, 1].
      const fraction = -prevV / (v - prevV);
      return prevT + fraction * (t - prevT);
    }
    prevT = t;
    prevV = v;
  }
  return null;
}

/**
 * Finds the time from which f stays ≥ 0 for the rest of [start, end] — the
 * point after which a decision is permanently ahead within the horizon.
 * Unlike `firstNonNegative`, a temporary lead that is later lost does not count.
 *
 * Returns `start` if f is non-negative throughout, `null` if f(end) < 0,
 * otherwise the exact zero crossing on the last segment where f turns from
 * negative to non-negative. Assumes f is linear between breakpoints.
 */
export function stableNonNegativeFrom(
  f: (t: number) => number,
  breakpoints: number[],
  start: number,
  end: number,
): number | null {
  if (end < start) return null;
  const points = normaliseBreakpoints(breakpoints, start, end);
  const values = points.map(f);
  if (values[values.length - 1]! < -EPSILON) return null;

  for (let i = points.length - 1; i > 0; i--) {
    const v = values[i - 1]!;
    if (v < -EPSILON) {
      const t0 = points[i - 1]!;
      const t1 = points[i]!;
      const v1 = values[i]!;
      return t0 + (-v / (v1 - v)) * (t1 - t0);
    }
  }
  return points[0]!;
}
