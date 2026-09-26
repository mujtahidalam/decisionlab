import type { FieldDefinition } from "./types";

/**
 * Converts between model values and display values for a field.
 * Only percent fields differ: 0.035 in the model ↔ 3.5 on screen.
 */
export function toDisplayValue(field: Pick<FieldDefinition, "unit">, modelValue: number): number {
  return field.unit === "percent" ? roundTo(modelValue * 100, 10) : modelValue;
}

export function toModelValue(field: Pick<FieldDefinition, "unit">, displayValue: number): number {
  return field.unit === "percent" ? roundTo(displayValue / 100, 12) : displayValue;
}

/** Rounds away binary floating-point noise (e.g. 0.035 * 100 = 3.5000000000000004). */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
