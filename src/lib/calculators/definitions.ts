/**
 * Calculation-model definitions, keyed by calculator slug: the formula version,
 * input fields and defaults of every calculator that has a model, plus the
 * server-side hooks API routes use to validate inputs and compute results.
 *
 * Registry entries without a definition (coming-soon calculators) have no model yet.
 */

import { toModelValue } from "./field-units";
import { DEFAULT_INPUTS, MASTERS_ROI_FORMULA_VERSION } from "./masters-roi/defaults";
import { MASTERS_ROI_FIELDS } from "./masters-roi/fields";
import { parseMastersRoiInputs } from "./masters-roi/input-parsing";
import { buildMastersRoiSessionResults } from "./masters-roi/session-results";
import type { FieldDefinition } from "./types";

export interface CalculatorDefinition {
  slug: string;
  formulaVersion: string;
  fields: readonly FieldDefinition[];
  /** Default values in model units, keyed by field name. */
  defaults: Readonly<Record<string, number>>;
  /** Validates untrusted input; returns model-unit inputs or per-field errors. */
  parseInputs: (raw: unknown) => { ok: true; inputs: Record<string, number>; warnings: string[] } | { ok: false; errors: Record<string, string> };
  /** Computes the results snapshot stored with a saved session. */
  computeSessionResults: (inputs: Record<string, number>) => Record<string, unknown>;
}

export const calculatorDefinitions: Readonly<Record<string, CalculatorDefinition>> = {
  "masters-roi": {
    slug: "masters-roi",
    formulaVersion: MASTERS_ROI_FORMULA_VERSION,
    fields: MASTERS_ROI_FIELDS,
    defaults: DEFAULT_INPUTS,
    parseInputs: (raw) => {
      const parsed = parseMastersRoiInputs(raw);
      return parsed.ok ? { ok: true, inputs: { ...parsed.inputs }, warnings: parsed.warnings } : parsed;
    },
    computeSessionResults: (inputs) =>
      buildMastersRoiSessionResults(inputs as unknown as Parameters<typeof buildMastersRoiSessionResults>[0]) as unknown as Record<string, unknown>,
  },
};

export function getCalculatorDefinition(slug: string): CalculatorDefinition | undefined {
  return Object.hasOwn(calculatorDefinitions, slug) ? calculatorDefinitions[slug] : undefined;
}

/** Field bounds converted from display units to model units (percent → decimal). */
export function modelValidationRules(field: FieldDefinition) {
  return {
    required: true,
    min: toModelValue(field, field.min),
    max: toModelValue(field, field.max),
    step: toModelValue(field, field.step),
  };
}
