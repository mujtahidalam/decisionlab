/**
 * Generic helpers for turning deterministic calculator output into the
 * AnalysisContext the AI layer interprets. Values are formatted exactly as the
 * UI displays them, so the AI can quote them verbatim and never needs to
 * compute or convert anything.
 */

import type { InfluenceLevel, LabelledValue, SensitivityContextRow } from "../../ai/types";
import { formatSignedCurrency, formatValue, type CurrencyCode } from "../../format";
import type { Assumption, FieldDefinition, SensitivityAnalysis } from "../types";

export function describeInputs<K extends string>(
  fields: readonly FieldDefinition<K>[],
  inputs: Record<K, number>,
  currency: CurrencyCode,
): LabelledValue[] {
  return fields.map((f) => ({ name: f.label, value: formatValue(inputs[f.key], f.unit, currency) }));
}

export function describeAssumptions(assumptions: readonly Assumption[], currency: CurrencyCode): string[] {
  return assumptions.map((a) =>
    a.value === undefined ? `${a.label}. ${a.detail}` : `${a.label}: ${formatValue(a.value, a.unit, currency)}. ${a.detail}`,
  );
}

/** Relative influence from the tornado swing: ≥50% of the largest swing is high, ≥20% medium. */
export function influenceLevel(swing: number, maxSwing: number): InfluenceLevel {
  if (maxSwing <= 0) return "low";
  const ratio = swing / maxSwing;
  return ratio >= 0.5 ? "high" : ratio >= 0.2 ? "medium" : "low";
}

export function describeSensitivity(analysis: SensitivityAnalysis, currency: CurrencyCode): { metric: string; rows: SensitivityContextRow[] } {
  const maxSwing = Math.max(0, ...analysis.rows.map((r) => r.swing));
  return {
    metric: `${analysis.metricLabel} (baseline ${formatSignedCurrency(analysis.baseline, currency)})`,
    rows: analysis.rows.map((r) => ({
      input: r.label,
      tested: r.rangeLabel,
      lowResult: `${formatValue(r.lowInput, r.unit, currency)} → ${formatSignedCurrency(r.lowOutcome, currency)}`,
      highResult: `${formatValue(r.highInput, r.unit, currency)} → ${formatSignedCurrency(r.highOutcome, currency)}`,
      influence: influenceLevel(r.swing, maxSwing),
    })),
  };
}
