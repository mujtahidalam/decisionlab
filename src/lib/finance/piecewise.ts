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
