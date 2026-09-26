/**
 * Generic scenario machinery. A scenario is plain data — adjustments applied
 * to the user's own inputs — so the UI can show exactly what it changes.
 */

import type { FieldDefinition } from "../types";
import { clampToFieldBounds, type Inputs } from "./bounds";

export type ScenarioId = "optimistic" | "expected" | "conservative";

export interface ScenarioAdjustment<K extends string> {
  key: K;
  /** "multiply": value × (1 + amount). "add": value + amount (model units). */
  kind: "multiply" | "add";
  amount: number;
  /** Human-readable description, e.g. "New salary +10%". */
  description: string;
}

export interface ScenarioDefinition<K extends string> {
  id: ScenarioId;
  label: string;
  summary: string;
  adjustments: readonly ScenarioAdjustment<K>[];
}

/** Returns new inputs with the scenario's adjustments applied and clamped to field bounds. */
export function applyScenarioAdjustments<K extends string, I extends Inputs<K>>(
  fields: readonly FieldDefinition<K>[],
  inputs: I,
  scenario: ScenarioDefinition<K>,
): I {
  const next = { ...inputs };
  for (const adj of scenario.adjustments) {
    const current = next[adj.key];
    const raw = adj.kind === "multiply" ? current * (1 + adj.amount) : current + adj.amount;
    (next as Record<K, number>)[adj.key] = clampToFieldBounds(fields, adj.key, raw);
  }
  return next;
}

export interface ScenarioOutcome<K extends string, I extends Inputs<K>, R> {
  scenario: ScenarioDefinition<K>;
  inputs: I;
  result: R;
}

export function runScenarioSet<K extends string, I extends Inputs<K>, R>(
  fields: readonly FieldDefinition<K>[],
  scenarios: readonly ScenarioDefinition<K>[],
  inputs: I,
  compute: (inputs: I) => R,
): ScenarioOutcome<K, I, R>[] {
  return scenarios.map((scenario) => {
    const adjusted = applyScenarioAdjustments(fields, inputs, scenario);
    return { scenario, inputs: adjusted, result: compute(adjusted) };
  });
}
