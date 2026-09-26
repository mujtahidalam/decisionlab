/**
 * Numeric guard: the AI may quote numbers, but never create them.
 *
 * Every quantity in the AI's text must also appear in the context it was given
 * (inputs, results, scenarios, sensitivity, assumptions — all computed
 * deterministically). Quantities are compared with their unit, so a digit that
 * happens to occur elsewhere can't launder an invented figure:
 *
 *   durations    "9 years 5 months" must match a duration in the context exactly
 *                ("about 6 years" fails even if "6 years 10 months" exists)
 *   percentages  "7.3%" must match a percentage in the context
 *   other        "$177,650", "10-year" — the number must appear in the context
 *
 * A recalculated, rounded, estimated or invented figure fails the check and
 * the whole response is rejected.
 */

import type { AnalysisContext, DecisionAnalysis } from "./types";
import { ANALYSIS_LIST_KEYS } from "./types";

const NUM = String.raw`\d[\d,.]*\d|\d`;
const QUANTITY_RE = new RegExp(
  String.raw`(${NUM})\s*years?(?:,?\s*(?:and\s+)?(${NUM})\s*months?)?` + // durations with years
    String.raw`|(${NUM})\s*months?` + // months-only durations
    String.raw`|(${NUM})\s*%` + // percentages
    String.raw`|(${NUM})`, // anything else
  "gi",
);

/** Normalises "177,650" → "177650" and "3.50" → "3.5" (grouping styles are symmetric with the context). */
function normalise(raw: string): string {
  const digits = raw.replace(/,/g, "");
  const n = Number(digits);
  return Number.isFinite(n) ? String(n) : digits;
}

/** Unit-aware quantity keys found in a text, e.g. ["dur:9y5m", "pct:3", "num:177650"]. */
export function extractQuantities(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(QUANTITY_RE)) {
    if (m[1] !== undefined) out.push(`dur:${normalise(m[1])}y${m[2] !== undefined ? normalise(m[2]) : "0"}m`);
    else if (m[3] !== undefined) out.push(`dur:0y${normalise(m[3])}m`);
    else if (m[4] !== undefined) out.push(`pct:${normalise(m[4])}`);
    else if (m[5] !== undefined) out.push(`num:${normalise(m[5])}`);
  }
  return out;
}

/** Every quantity the AI is allowed to mention. Plain numbers also match any quantity with the same value. */
export function allowedQuantities(context: AnalysisContext): Set<string> {
  const keys = extractQuantities(JSON.stringify(context));
  const allowed = new Set(keys);
  for (const key of keys) {
    if (key.startsWith("pct:")) allowed.add(`num:${key.slice(4)}`);
    const dur = /^dur:(.+)y(.+)m$/.exec(key);
    if (dur) {
      allowed.add(`num:${dur[1]}`);
      allowed.add(`num:${dur[2]}`);
    }
  }
  return allowed;
}

export interface NumericGuardResult {
  ok: boolean;
  /** Quantities in the AI text that the calculator never produced. */
  unexpected: string[];
}

export function checkNumbers(analysis: DecisionAnalysis, context: AnalysisContext): NumericGuardResult {
  const allowed = allowedQuantities(context);
  const texts = [analysis.summary, ...ANALYSIS_LIST_KEYS.flatMap((k) => analysis[k])];
  const unexpected = [...new Set(texts.flatMap(extractQuantities).filter((q) => !allowed.has(q)))];
  return { ok: unexpected.length === 0, unexpected };
}
