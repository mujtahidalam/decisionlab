/**
 * analyzeDecision — the single entry point of the AI layer.
 *
 *   AnalysisContext (deterministic numbers, pre-formatted)
 *     → compact prompt → LLM provider (structured output)
 *     → schema validation → numeric guard → DecisionAnalysis
 *
 * Calculator-agnostic: callers pass any calculator's context. The provider
 * is injected, so it can be swapped (or faked in tests) without touching
 * calculators or routes.
 */

import { checkNumbers } from "./numeric-guard";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import { ProviderError, type LlmProvider } from "./providers/types";
import { DECISION_ANALYSIS_JSON_SCHEMA, validateDecisionAnalysis } from "./schema";
import type { AnalysisContext, DecisionAnalysis } from "./types";

export const ANALYSIS_LIMITS = Object.freeze({ maxOutputTokens: 900, timeoutMs: 25_000 });

export type AnalysisErrorCode = "provider_error" | "invalid_response" | "unverified_numbers";

export class AnalysisError extends Error {
  constructor(
    readonly code: AnalysisErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AnalysisError";
  }
}

export interface AnalyzeDecisionParams {
  context: AnalysisContext;
  provider: LlmProvider;
  /** Reject responses that contain numbers not present in the context (default true). */
  enforceNumericGuard?: boolean;
}

export async function analyzeDecision({ context, provider, enforceNumericGuard = true }: AnalyzeDecisionParams): Promise<DecisionAnalysis> {
  let raw: unknown;
  try {
    raw = await provider.generateStructured({
      system: SYSTEM_PROMPT,
      user: buildUserMessage(context),
      schemaName: "decision_analysis",
      schema: DECISION_ANALYSIS_JSON_SCHEMA as unknown as Record<string, unknown>,
      ...ANALYSIS_LIMITS,
    });
  } catch (error) {
    if (error instanceof ProviderError && (error.kind === "invalid_json" || error.kind === "truncated")) {
      throw new AnalysisError("invalid_response", error.message);
    }
    throw new AnalysisError("provider_error", error instanceof Error ? error.message : "AI provider failed.");
  }

  const validated = validateDecisionAnalysis(raw);
  if (!validated.ok) throw new AnalysisError("invalid_response", `AI response failed validation: ${validated.reason}`);

  if (enforceNumericGuard) {
    const guard = checkNumbers(validated.value, context);
    if (!guard.ok) throw new AnalysisError("unverified_numbers", `AI response contained numbers not produced by the calculator.`);
  }
  return validated.value;
}
