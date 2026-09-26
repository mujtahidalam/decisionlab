/**
 * Parses untrusted input (e.g. a JSON request body) into MastersRoiInputs.
 * Used by API routes; strict on purpose: unknown keys, missing keys and
 * non-numeric values are rejected rather than silently defaulted.
 */

import { MASTERS_ROI_FIELDS } from "./fields";
import type { MastersRoiInputKey, MastersRoiInputs } from "./types";
import { validateMastersRoiInputs } from "./validation";

export type ParseResult =
  | { ok: true; inputs: MastersRoiInputs; warnings: string[] }
  | { ok: false; errors: Record<string, string> };

const KNOWN_KEYS = new Set<string>(MASTERS_ROI_FIELDS.map((f) => f.key));

export function parseMastersRoiInputs(raw: unknown): ParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: { inputs: "inputs must be an object." } };
  }
  const record = raw as Record<string, unknown>;
  const errors: Record<string, string> = {};

  for (const key of Object.keys(record)) {
    if (!KNOWN_KEYS.has(key)) errors[key] = `Unknown input "${key}".`;
  }

  const inputs = {} as MastersRoiInputs;
  for (const field of MASTERS_ROI_FIELDS) {
    const value = record[field.key];
    if (value === undefined) errors[field.key] = `${field.label} is required.`;
    else if (typeof value !== "number" || !Number.isFinite(value)) errors[field.key] = `${field.label} must be a number.`;
    else inputs[field.key as MastersRoiInputKey] = value;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const validation = validateMastersRoiInputs(inputs);
  if (!validation.valid) return { ok: false, errors: validation.errors as Record<string, string> };
  return { ok: true, inputs, warnings: validation.warnings };
}
