/**
 * Generic strict parser for untrusted inputs (e.g. API request bodies):
 * unknown keys, missing keys and non-numeric values are rejected rather than
 * silently defaulted, then the calculator's own validation runs.
 */

import type { FieldDefinition, ValidationResult } from "../types";
import type { Inputs } from "./bounds";

export type ParseResult<I> =
  | { ok: true; inputs: I; warnings: string[] }
  | { ok: false; errors: Record<string, string> };

export function createInputParser<K extends string, I extends Inputs<K>>(config: {
  fields: readonly FieldDefinition<K>[];
  validate: (inputs: I) => ValidationResult<K>;
}): (raw: unknown) => ParseResult<I> {
  const known = new Set<string>(config.fields.map((f) => f.key));
  return (raw) => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return { ok: false, errors: { inputs: "inputs must be an object." } };
    }
    const record = raw as Record<string, unknown>;
    const errors: Record<string, string> = {};
    for (const key of Object.keys(record)) if (!known.has(key)) errors[key] = `Unknown input "${key}".`;

    const inputs = {} as Record<K, number>;
    for (const field of config.fields) {
      const value = record[field.key];
      if (value === undefined) errors[field.key] = `${field.label} is required.`;
      else if (typeof value !== "number" || !Number.isFinite(value)) errors[field.key] = `${field.label} must be a number.`;
      else inputs[field.key] = value;
    }
    if (Object.keys(errors).length > 0) return { ok: false, errors };

    const validation = config.validate(inputs as I);
    if (!validation.valid) return { ok: false, errors: validation.errors as Record<string, string> };
    return { ok: true, inputs: inputs as I, warnings: validation.warnings };
  };
}
