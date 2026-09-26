/**
 * Master's ROI scenarios: optimistic / expected / conservative, built on the
 * shared scenario framework. The definitions are data, shown verbatim in the UI.
 */

import { clampToFieldBounds } from "../framework/bounds";
import {
  applyScenarioAdjustments,
  runScenarioSet,
  type ScenarioAdjustment as GenericAdjustment,
  type ScenarioDefinition as GenericDefinition,
  type ScenarioId,
  type ScenarioOutcome as GenericOutcome,
} from "../framework/scenarios";
import { calculateMastersRoi } from "./engine";
import { MASTERS_ROI_FIELDS } from "./fields";
import type { MastersRoiInputKey, MastersRoiInputs, MastersRoiResult } from "./types";

export type { ScenarioId };
export type ScenarioAdjustment = GenericAdjustment<MastersRoiInputKey>;
export type ScenarioDefinition = GenericDefinition<MastersRoiInputKey>;
export type ScenarioOutcome = GenericOutcome<MastersRoiInputKey, MastersRoiInputs, MastersRoiResult>;

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: "optimistic",
    label: "Optimistic",
    summary: "A stronger job market after graduation and slightly lower living costs.",
    adjustments: [
      { key: "postDegreeSalary", kind: "multiply", amount: 0.1, description: "Post-degree salary +10%" },
      { key: "salaryGrowthRate", kind: "add", amount: 0.01, description: "Salary growth +1 percentage point" },
      { key: "livingExpenses", kind: "multiply", amount: -0.05, description: "Living expenses −5%" },
    ],
  },
  {
    id: "expected",
    label: "Expected",
    summary: "Exactly the values you entered.",
    adjustments: [],
  },
  {
    id: "conservative",
    label: "Conservative",
    summary: "A weaker starting salary, slower raises, higher costs and a job search.",
    adjustments: [
      { key: "postDegreeSalary", kind: "multiply", amount: -0.15, description: "Post-degree salary −15%" },
      { key: "salaryGrowthRate", kind: "add", amount: -0.01, description: "Salary growth −1 percentage point" },
      { key: "livingExpenses", kind: "multiply", amount: 0.1, description: "Living expenses +10%" },
      { key: "jobSearchMonths", kind: "add", amount: 3, description: "3 extra months of job search" },
    ],
  },
] as const;

/** Clamps a model value into the field's allowed range. */
export function clampToField(key: MastersRoiInputKey, value: number): number {
  return clampToFieldBounds(MASTERS_ROI_FIELDS, key, value);
}

export function applyScenario(inputs: MastersRoiInputs, scenario: ScenarioDefinition): MastersRoiInputs {
  return applyScenarioAdjustments(MASTERS_ROI_FIELDS, inputs, scenario);
}

/** Runs the engine once per scenario, in optimistic → expected → conservative order. */
export function runScenarios(inputs: MastersRoiInputs): ScenarioOutcome[] {
  return runScenarioSet(MASTERS_ROI_FIELDS, SCENARIOS, inputs, calculateMastersRoi);
}
