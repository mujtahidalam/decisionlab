/**
 * Master's ROI sensitivity analysis on the shared framework: which assumption
 * moves the 5- or 10-year impact most.
 */

import type { SensitivityAnalysis } from "../types";
import { byAmount, byPercent, runSensitivity, type SensitivityVariation } from "../framework/sensitivity";
import { calculateMastersRoi } from "./engine";
import { MASTERS_ROI_FIELDS } from "./fields";
import type { MastersRoiInputKey, MastersRoiInputs } from "./types";

/** The tested range for each input. */
export const SENSITIVITY_VARIATIONS: readonly SensitivityVariation<MastersRoiInputKey>[] = [
  { key: "postDegreeSalary", rangeLabel: "±20%", ...byPercent(0.2) },
  { key: "currentSalary", rangeLabel: "±20%", ...byPercent(0.2) },
  { key: "tuition", rangeLabel: "±20%", ...byPercent(0.2) },
  { key: "livingExpenses", rangeLabel: "±20%", ...byPercent(0.2) },
  { key: "scholarship", rangeLabel: "±20%", ...byPercent(0.2) },
  { key: "studyDurationYears", rangeLabel: "±6 months", ...byAmount(0.5) },
  { key: "salaryGrowthRate", rangeLabel: "±2 percentage points", ...byAmount(0.02) },
  { key: "jobSearchMonths", rangeLabel: "±3 months", ...byAmount(3) },
];

export type SensitivityMetric = "impact10Year" | "impact5Year";

const METRIC_LABELS: Record<SensitivityMetric, string> = {
  impact10Year: "10-year financial impact",
  impact5Year: "5-year financial impact",
};

export function analyseSensitivity(
  inputs: MastersRoiInputs,
  metric: SensitivityMetric = "impact10Year",
): SensitivityAnalysis {
  return runSensitivity({
    fields: MASTERS_ROI_FIELDS,
    variations: SENSITIVITY_VARIATIONS,
    inputs,
    metric: (i) => calculateMastersRoi(i)[metric],
    metricLabel: METRIC_LABELS[metric],
  });
}
