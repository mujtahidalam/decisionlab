/**
 * Shared contracts for every DecisionLens calculator.
 *
 * These types let generic UI components (input panels, assumption lists,
 * sensitivity charts) render any calculator from plain data, so new
 * calculators only need to supply models, an engine and configuration.
 */

/** How a numeric value should be interpreted and displayed. */
export type ValueUnit = "currency" | "percent" | "years" | "months" | "multiplier" | "text";

/**
 * Declarative description of one numeric input.
 *
 * Percent fields are stored as decimals in the model (0.03 = 3%) and displayed
 * multiplied by 100; `min`, `max` and `step` are expressed in *display* units.
 */
export interface FieldDefinition<K extends string = string> {
  key: K;
  label: string;
  unit: Exclude<ValueUnit, "text" | "multiplier">;
  help: string;
  min: number;
  max: number;
  step: number;
  /** "core" fields are always visible; "advanced" fields live in a disclosure. */
  group: "core" | "advanced";
  /** Optional heading to group related core fields (e.g. "Current job"). */
  section?: string;
}

/** A single assumption the engine relied on, surfaced verbatim to users. */
export interface Assumption {
  id: string;
  label: string;
  /** Numeric value, formatted by the UI according to `unit`. Omitted for text-only assumptions. */
  value?: number;
  unit: ValueUnit;
  /** Plain-language explanation of what the assumption means. */
  detail: string;
}

/** Outcome of validating a set of inputs. Errors block calculation; warnings don't. */
export interface ValidationResult<K extends string = string> {
  valid: boolean;
  errors: Partial<Record<K, string>>;
  warnings: string[];
}

/** One row of a one-at-a-time sensitivity analysis. */
export interface SensitivityRow {
  id: string;
  label: string;
  /** Human-readable description of the tested range, e.g. "±20%". */
  rangeLabel: string;
  /** Unit of the tested input, so the UI can format lowInput/highInput. */
  unit: Exclude<ValueUnit, "text">;
  /** Input value tested at the low end (model units). */
  lowInput: number;
  /** Input value tested at the high end (model units). */
  highInput: number;
  /** Output metric value when the assumption is at its low value. */
  lowOutcome: number;
  /** Output metric value when the assumption is at its high value. */
  highOutcome: number;
  /** |highOutcome − lowOutcome| — used for ranking. */
  swing: number;
}

export interface SensitivityAnalysis {
  metricLabel: string;
  baseline: number;
  /** Rows sorted by descending swing (most influential first). */
  rows: SensitivityRow[];
}

/** Registry entry used by navigation, the landing page and the sitemap. */
export interface CalculatorMeta {
  slug: string;
  path: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  category: "Education" | "Career" | "Housing" | "Finance";
  status: "live" | "coming-soon";
}

/** One step of a calculator's "How this calculation works" section. */
export interface MethodologyStep {
  title: string;
  /** Optional plain-text formula shown in monospace. */
  formula?: string;
  body: string;
}

/** A question/answer pair; also emitted as FAQPage JSON-LD. */
export interface FaqItem {
  question: string;
  answer: string;
}
