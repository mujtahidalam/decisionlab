/**
 * Step-growth salary primitives.
 *
 * Model: a job whose starting annual salary is `base` pays
 *   salary(τ) = base · (1 + g)^⌊τ⌋
 * during its τ-th year of employment (τ ≥ 0). In words: pay is constant within
 * each employment year and rises by `g` on every anniversary — which mirrors
 * how annual raises work in practice.
 *
 * Everything here is pure and deterministic. No rounding is applied; rounding is
 * a presentation concern handled in `lib/format.ts`.
 */

/** Guards against invalid numeric input in a way that fails loudly in tests. */
function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number (received ${value}).`);
  }
}

/**
 * Annual salary rate in force at employment time `tau` (years since the job started).
 *
 * @example salaryAt(50_000, 0.03, 2.5) // 50_000 · 1.03² = 53_045
 */
export function salaryAt(base: number, growthRate: number, tau: number): number {
  assertFinite("base", base);
  assertFinite("growthRate", growthRate);
  assertFinite("tau", tau);
  if (growthRate <= -1) throw new RangeError("growthRate must be greater than -100%.");
  if (tau < 0) return 0;
  return base * Math.pow(1 + growthRate, Math.floor(tau));
}

/**
 * Total earnings between employment times `from` and `to` (years since the job
 * started), integrating the step-growth salary exactly — including partial years.
 * Times before 0 contribute nothing (the job had not started).
 *
 * @example earningsBetween(50_000, 0.1, 0, 1.5) // 50_000 + 0.5 · 55_000 = 77_500
 */
export function earningsBetween(
  base: number,
  growthRate: number,
  from: number,
  to: number,
): number {
  assertFinite("base", base);
  assertFinite("growthRate", growthRate);
  assertFinite("from", from);
  assertFinite("to", to);
  if (growthRate <= -1) throw new RangeError("growthRate must be greater than -100%.");

  const start = Math.max(0, from);
  const end = Math.max(0, to);
  if (end <= start) return 0;

  let total = 0;
  for (let year = Math.floor(start); year < end; year++) {
    const overlap = Math.min(end, year + 1) - Math.max(start, year);
    if (overlap > 0) total += base * Math.pow(1 + growthRate, year) * overlap;
  }
  return total;
}

/**
 * Convenience: cumulative earnings from the first day of the job up to `tau`.
 */
export function cumulativeEarnings(base: number, growthRate: number, tau: number): number {
  return earningsBetween(base, growthRate, 0, tau);
}
