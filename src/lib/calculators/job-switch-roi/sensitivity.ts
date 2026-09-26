/** Job Switch sensitivity analysis: which assumption moves the 5-year impact most. */

import { byAmount, byPercent, runSensitivity, type SensitivityVariation } from "../framework/sensitivity";
import type { SensitivityAnalysis } from "../types";
import { impactAfter } from "./engine";
import { JOB_SWITCH_FIELDS } from "./fields";
import type { JobSwitchInputKey, JobSwitchInputs } from "./types";

export const JOB_SWITCH_SENSITIVITY_VARIATIONS: readonly SensitivityVariation<JobSwitchInputKey>[] = [
  { key: "newSalary", rangeLabel: "±10%", ...byPercent(0.1) },
  { key: "currentSalary", rangeLabel: "±10%", ...byPercent(0.1) },
  { key: "newGrowthRate", rangeLabel: "±2 percentage points", ...byAmount(0.02) },
  { key: "currentGrowthRate", rangeLabel: "±2 percentage points", ...byAmount(0.02) },
  { key: "newBonus", rangeLabel: "±50%", ...byPercent(0.5) },
  { key: "currentBonus", rangeLabel: "±50%", ...byPercent(0.5) },
  { key: "signingBonus", rangeLabel: "±50%", ...byPercent(0.5) },
  { key: "forfeitedCompensation", rangeLabel: "±50%", ...byPercent(0.5) },
  { key: "relocationCost", rangeLabel: "±50%", ...byPercent(0.5) },
  { key: "gapMonths", rangeLabel: "±2 months", ...byAmount(2) },
  { key: "annualCostChange", rangeLabel: "±50%", ...byPercent(0.5) },
];

export function analyseJobSwitchSensitivity(inputs: JobSwitchInputs, years: 1 | 3 | 5 = 5): SensitivityAnalysis {
  return runSensitivity({
    fields: JOB_SWITCH_FIELDS,
    variations: JOB_SWITCH_SENSITIVITY_VARIATIONS,
    inputs,
    // The engine's impact function is pure; full validation happens once in calculateJobSwitch.
    metric: (i) => impactAfter(i, years),
    metricLabel: `${years}-year financial impact`,
  });
}
