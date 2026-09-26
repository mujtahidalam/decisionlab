/** Provider-neutral interface for structured LLM calls. Swap providers without touching calculators. */

export interface StructuredGenerationRequest {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  /** Hard cap on generated tokens (cost control). */
  maxOutputTokens: number;
  timeoutMs: number;
}

export interface LlmProvider {
  /** Human-readable id for logs/metadata, e.g. "openai:gpt-4o-mini". Never includes secrets. */
  readonly id: string;
  /** Returns the parsed JSON object produced by the model, or throws a ProviderError. */
  generateStructured(request: StructuredGenerationRequest): Promise<unknown>;
}

export type ProviderErrorKind = "timeout" | "http" | "refusal" | "invalid_json" | "truncated" | "network";

export class ProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
