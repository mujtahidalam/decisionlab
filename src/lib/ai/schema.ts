/**
 * Output schema for the AI report and a strict server-side validator.
 *
 * The JSON schema is sent to the provider's structured-output mode. The
 * provider's guarantee is not trusted blindly: every response is validated
 * here again before it reaches the browser.
 */

import { ANALYSIS_LIST_KEYS, type DecisionAnalysis } from "./types";

export const MAX_ITEMS_PER_LIST = 6;
export const MAX_STRING_LENGTH = 900;

const stringArray = { type: "array", items: { type: "string" } } as const;

/** JSON Schema (strict-mode compatible: every property required, no extra properties). */
export const DECISION_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", ...ANALYSIS_LIST_KEYS],
  properties: {
    summary: { type: "string" },
    key_drivers: stringArray,
    risks: stringArray,
    sensitivity: stringArray,
    assumptions: stringArray,
    questions_to_consider: stringArray,
  },
} as const;

export type SchemaValidation = { ok: true; value: DecisionAnalysis } | { ok: false; reason: string };

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_STRING_LENGTH) return null;
  return trimmed;
}

/**
 * Validates and normalises an AI response. Rejects missing, extra, empty or
 * wrongly typed fields; trims strings and caps lists at MAX_ITEMS_PER_LIST.
 */
export function validateDecisionAnalysis(raw: unknown): SchemaValidation {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, reason: "not an object" };
  const record = raw as Record<string, unknown>;

  const allowed = new Set<string>(["summary", ...ANALYSIS_LIST_KEYS]);
  const extra = Object.keys(record).filter((k) => !allowed.has(k));
  if (extra.length > 0) return { ok: false, reason: `unexpected fields: ${extra.join(", ")}` };

  const summary = cleanString(record.summary);
  if (!summary) return { ok: false, reason: "summary missing, empty or too long" };

  const out = { summary } as DecisionAnalysis;
  for (const key of ANALYSIS_LIST_KEYS) {
    const list = record[key];
    if (!Array.isArray(list) || list.length === 0) return { ok: false, reason: `${key} must be a non-empty array` };
    const items: string[] = [];
    for (const item of list.slice(0, MAX_ITEMS_PER_LIST)) {
      const s = cleanString(item);
      if (!s) return { ok: false, reason: `${key} contains an empty, non-string or too-long item` };
      items.push(s);
    }
    out[key] = items;
  }
  return { ok: true, value: out };
}
