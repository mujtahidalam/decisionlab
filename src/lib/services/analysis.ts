/**
 * AI analysis service: validates an untrusted request, recomputes every number
 * with the deterministic engine, and asks the AI layer to interpret them.
 *
 * Framework-agnostic so it can be unit-tested with a fake provider. Nothing is
 * stored, and inputs are never logged.
 */

import { AnalysisError, analyzeDecision } from "../ai/analyzeDecision";
import type { LlmProvider } from "../ai/providers/types";
import type { DecisionAnalysis } from "../ai/types";
import { getCalculatorDefinition } from "../calculators/definitions";
import { DEFAULT_CURRENCY, isCurrencyCode } from "../format";

export type AnalysisServiceResult =
  | { ok: true; analysis: DecisionAnalysis; meta: { calculator: string; formulaVersion: string; provider: string } }
  | {
      ok: false;
      status: 400 | 404 | 422 | 502 | 503;
      code: "invalid_request" | "unknown_calculator" | "not_supported" | "invalid_inputs" | "ai_unavailable" | "ai_not_configured";
      error: string;
      fieldErrors?: Record<string, string>;
    };

/**
 * Body: { calculator: string, inputs: {...}, currency?: string }.
 * Any `results`, `scenarios` or `sensitivity` sent by the client are ignored:
 * the AI only ever sees numbers the server computed itself.
 */
export async function runAnalysis(body: unknown, provider: LlmProvider | null): Promise<AnalysisServiceResult> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, status: 400, code: "invalid_request", error: "Request body must be a JSON object." };
  }
  const { calculator, inputs, currency } = body as { calculator?: unknown; inputs?: unknown; currency?: unknown };

  if (typeof calculator !== "string" || calculator.length === 0 || calculator.length > 64) {
    return { ok: false, status: 400, code: "invalid_request", error: '"calculator" is required.' };
  }
  if (inputs === undefined) return { ok: false, status: 400, code: "invalid_request", error: '"inputs" is required.' };
  if (currency !== undefined && (typeof currency !== "string" || !isCurrencyCode(currency))) {
    return { ok: false, status: 400, code: "invalid_request", error: '"currency" must be a supported currency code.' };
  }

  const definition = getCalculatorDefinition(calculator);
  if (!definition) return { ok: false, status: 404, code: "unknown_calculator", error: "Unknown calculator." };
  if (!definition.buildAnalysisContext) {
    return { ok: false, status: 422, code: "not_supported", error: "AI analysis is not available for this calculator." };
  }

  const parsed = definition.parseInputs(inputs);
  if (!parsed.ok) return { ok: false, status: 400, code: "invalid_inputs", error: "Invalid inputs.", fieldErrors: parsed.errors };

  if (!provider) return { ok: false, status: 503, code: "ai_not_configured", error: "AI analysis is not configured." };

  const context = definition.buildAnalysisContext(parsed.inputs, (currency as typeof DEFAULT_CURRENCY | undefined) ?? DEFAULT_CURRENCY);
  try {
    const analysis = await analyzeDecision({ context, provider });
    return { ok: true, analysis, meta: { calculator: definition.slug, formulaVersion: definition.formulaVersion, provider: provider.id } };
  } catch (error) {
    // Log the failure category only — never inputs, results or AI text.
    const code = error instanceof AnalysisError ? error.code : "unexpected";
    console.warn(`[ai] analysis failed (${code}) for ${definition.slug}`);
    return { ok: false, status: 502, code: "ai_unavailable", error: "AI analysis is temporarily unavailable." };
  }
}
