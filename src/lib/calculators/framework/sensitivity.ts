/**
 * Generic one-at-a-time ("tornado") sensitivity analysis: each assumption is
 * moved to a low and a high value while all others stay fixed, and assumptions
 * are ranked by the resulting swing in one output metric.
 */

import type { FieldDefinition, SensitivityAnalysis, SensitivityRow } from "../types";
import { clampToFieldBounds, findField, type Inputs } from "./bounds";

export interface SensitivityVariation<K extends string> {
  key: K;
  rangeLabel: string;
  low: (value: number) => number;
  high: (value: number) => number;
}

/** ±p relative change, e.g. byPercent(0.2) → ±20%. */
export const byPercent = (p: number) => ({ low: (v: number) => v * (1 - p), high: (v: number) => v * (1 + p) });
/** ±delta absolute change (model units). */
export const byAmount = (delta: number) => ({ low: (v: number) => v - delta, high: (v: number) => v + delta });

export function runSensitivity<K extends string, I extends Inputs<K>>(params: {
  fields: readonly FieldDefinition<K>[];
  variations: readonly SensitivityVariation<K>[];
  inputs: I;
  metric: (inputs: I) => number;
  metricLabel: string;
}): SensitivityAnalysis {
  const { fields, variations, inputs, metric, metricLabel } = params;
  const baseline = metric(inputs);

  const rows: SensitivityRow[] = variations.map((v) => {
    const field = findField(fields, v.key);
    const value = inputs[v.key];
    const lowInput = clampToFieldBounds(fields, v.key, v.low(value));
    const highInput = clampToFieldBounds(fields, v.key, v.high(value));
    const lowOutcome = metric({ ...inputs, [v.key]: lowInput });
    const highOutcome = metric({ ...inputs, [v.key]: highInput });
    return {
      id: v.key,
      label: field.label,
      rangeLabel: v.rangeLabel,
      unit: field.unit,
      lowInput,
      highInput,
      lowOutcome,
      highOutcome,
      swing: Math.abs(highOutcome - lowOutcome),
    };
  });

  rows.sort((a, b) => b.swing - a.swing); // stable: ties keep configured order
  return { metricLabel, baseline, rows };
}
