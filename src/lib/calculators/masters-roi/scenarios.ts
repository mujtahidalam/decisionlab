/**
 * Scenario analysis: optimistic / expected / conservative.
 *
 * Scenarios are plain data — a list of adjustments applied to the user's own
 * inputs — so the UI can show exactly what each scenario changes.
 */

import { toModelValue } from "../field-units";
import { calculateMastersRoi } from "./engine";
import { getField } from "./fields";
import type { MastersRoiInputKey, MastersRoiInputs, MastersRoiResult } from "./types";

export type ScenarioId = "optimistic" | "expected" | "conservative";

export interface ScenarioAdjustment {
  key: MastersRoiInputKey;
  /** "multiply": value × (1 + amount). "add": value + amount (in model units). */
  kind: "multiply" | "add";
  amount: number;
  /** Human-readable description, e.g. "Post-degree salary +10%". */
  description: string;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  summary: string;
  adjustments: readonly ScenarioAdjustment[];
}

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
  const field = getField(key);
  const min = toModelValue(field, field.min);
  const max = toModelValue(field, field.max);
  return Math.min(max, Math.max(min, value));
}

/** Returns a new inputs object with the scenario's adjustments applied (and clamped). */
export function applyScenario(inputs: MastersRoiInputs, scenario: ScenarioDefinition): MastersRoiInputs {
  const next: MastersRoiInputs = { ...inputs };
  for (const adj of scenario.adjustments) {
    const current = next[adj.key];
    const raw = adj.kind === "multiply" ? current * (1 + adj.amount) : current + adj.amount;
    next[adj.key] = clampToField(adj.key, raw);
  }
  return next;
}

export interface ScenarioOutcome {
  scenario: ScenarioDefinition;
  inputs: MastersRoiInputs;
  result: MastersRoiResult;
}

/** Runs the engine once per scenario, in optimistic → expected → conservative order. */
export function runScenarios(inputs: MastersRoiInputs): ScenarioOutcome[] {
  return SCENARIOS.map((scenario) => {
    const adjusted = applyScenario(inputs, scenario);
    return { scenario, inputs: adjusted, result: calculateMastersRoi(adjusted) };
  });
}
