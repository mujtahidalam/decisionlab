/**
 * One-at-a-time ("tornado") sensitivity analysis.
 *
 * Each assumption is moved to a low and a high value while every other input
 * stays at the user's value. The resulting spread in the chosen output metric
 * shows which assumptions the answer depends on most.
 */

import type { SensitivityAnalysis, SensitivityRow } from "../types";
import { calculateMastersRoi } from "./engine";
import { getField } from "./fields";
import { clampToField } from "./scenarios";
import type { MastersRoiInputKey, MastersRoiInputs, MastersRoiResult } from "./types";

export interface SensitivityVariation {
  key: MastersRoiInputKey;
  rangeLabel: string;
  low: (value: number) => number;
  high: (value: number) => number;
}

const pct = (p: number) => ({
  low: (v: number) => v * (1 - p),
  high: (v: number) => v * (1 + p),
});
const plus = (delta: number) => ({
  low: (v: number) => v - delta,
  high: (v: number) => v + delta,
});

/** The tested range for each input. */
export const SENSITIVITY_VARIATIONS: readonly SensitivityVariation[] = [
  { key: "postDegreeSalary", rangeLabel: "±20%", ...pct(0.2) },
  { key: "currentSalary", rangeLabel: "±20%", ...pct(0.2) },
  { key: "tuition", rangeLabel: "±20%", ...pct(0.2) },
  { key: "livingExpenses", rangeLabel: "±20%", ...pct(0.2) },
  { key: "scholarship", rangeLabel: "±20%", ...pct(0.2) },
  { key: "studyDurationYears", rangeLabel: "±6 months", ...plus(0.5) },
  { key: "salaryGrowthRate", rangeLabel: "±2 percentage points", ...plus(0.02) },
  { key: "jobSearchMonths", rangeLabel: "±3 months", ...plus(3) },
];

export type SensitivityMetric = "impact10Year" | "impact5Year";

const METRIC_LABELS: Record<SensitivityMetric, string> = {
  impact10Year: "10-year financial impact",
  impact5Year: "5-year financial impact",
};

/**
 * Runs the sensitivity analysis on the given metric. Rows are sorted by
 * descending swing; inputs whose variation has no effect have swing 0.
 */
export function analyseSensitivity(
  inputs: MastersRoiInputs,
  metric: SensitivityMetric = "impact10Year",
): SensitivityAnalysis {
  const read = (r: MastersRoiResult) => r[metric];
  const baseline = read(calculateMastersRoi(inputs));

  const rows: SensitivityRow[] = SENSITIVITY_VARIATIONS.map((v) => {
    const field = getField(v.key);
    const value = inputs[v.key];
    const lowInput = clampToField(v.key, v.low(value));
    const highInput = clampToField(v.key, v.high(value));
    const lowOutcome = read(calculateMastersRoi({ ...inputs, [v.key]: lowInput }));
    const highOutcome = read(calculateMastersRoi({ ...inputs, [v.key]: highInput }));
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

  rows.sort((a, b) => b.swing - a.swing);
  return { metricLabel: METRIC_LABELS[metric], baseline, rows };
}
