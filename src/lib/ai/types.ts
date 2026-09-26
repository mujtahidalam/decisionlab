/**
 * Contracts for the AI decision-analysis layer.
 *
 * The AI never sees raw engine objects. Each calculator builds an
 * `AnalysisContext` — already-calculated values, pre-formatted as display
 * strings — and the AI may only interpret it. It is calculator-agnostic:
 * nothing in lib/ai knows about any specific calculator.
 */

/** A labelled value exactly as the calculator displays it (e.g. "Net investment" → "$177,650"). */
export interface LabelledValue {
  name: string;
  value: string;
}

export interface ScenarioContext {
  name: string;
  /** What the scenario changes relative to the user's inputs. */
  changes: string[];
  results: LabelledValue[];
}

export type InfluenceLevel = "high" | "medium" | "low";

export interface SensitivityContextRow {
  input: string;
  tested: string;
  lowResult: string;
  highResult: string;
  influence: InfluenceLevel;
}

/** Everything the AI is allowed to know, all computed deterministically. */
export interface AnalysisContext {
  calculatorType: string;
  calculatorName: string;
  formulaVersion: string;
  currency: string;
  inputs: LabelledValue[];
  results: LabelledValue[];
  scenarios: ScenarioContext[];
  sensitivity: { metric: string; rows: SensitivityContextRow[] };
  assumptions: string[];
  warnings: string[];
}

/** The structured report returned to the browser. */
export interface DecisionAnalysis {
  summary: string;
  key_drivers: string[];
  risks: string[];
  sensitivity: string[];
  assumptions: string[];
  questions_to_consider: string[];
}

export const ANALYSIS_LIST_KEYS = ["key_drivers", "risks", "sensitivity", "assumptions", "questions_to_consider"] as const;
