/**
 * Field-bound helpers shared by every calculator: range validation and clamping
 * driven entirely by FieldDefinition[] (bounds are in display units).
 */

import { toDisplayValue, toModelValue } from "../field-units";
import type { FieldDefinition } from "../types";

export type Inputs<K extends string> = Record<K, number>;

export function findField<K extends string>(fields: readonly FieldDefinition<K>[], key: K): FieldDefinition<K> {
  const field = fields.find((f) => f.key === key);
  if (!field) throw new Error(`Unknown field: ${key}`);
  return field;
}

/** Clamps a model value into the field's allowed range. */
export function clampToFieldBounds<K extends string>(fields: readonly FieldDefinition<K>[], key: K, value: number): number {
  const field = findField(fields, key);
  const min = toModelValue(field, field.min);
  const max = toModelValue(field, field.max);
  return Math.min(max, Math.max(min, value));
}

/** True when a model value lies within the field's bounds. */
export function isWithinBounds(field: FieldDefinition, value: number): boolean {
  const shown = toDisplayValue(field, value);
  return shown >= field.min && shown <= field.max;
}

/** Per-field errors for non-numeric or out-of-range values. */
export function validateBounds<K extends string>(
  fields: readonly FieldDefinition<K>[],
  inputs: Inputs<K>,
): Partial<Record<K, string>> {
  const errors: Partial<Record<K, string>> = {};
  for (const field of fields) {
    const raw = inputs[field.key];
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      errors[field.key] = `${field.label} must be a number.`;
    } else if (!isWithinBounds(field, raw)) {
      const unit = field.unit === "percent" ? "%" : field.unit === "years" ? " years" : field.unit === "months" ? " months" : "";
      errors[field.key] = `${field.label} must be between ${field.min}${unit} and ${field.max}${unit}.`;
    }
  }
  return errors;
}
