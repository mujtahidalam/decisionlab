/**
 * OpenAI provider using the Chat Completions API with Structured Outputs
 * (response_format: json_schema, strict). Uses fetch directly — no SDK
 * dependency. Server-side only: the API key is read by the caller from the
 * environment and never leaves the server.
 */

import { ProviderError, type LlmProvider, type StructuredGenerationRequest } from "./types";

export interface OpenAiConfig {
  apiKey: string;
  model: string;
  /** Override for OpenAI-compatible endpoints; defaults to https://api.openai.com/v1. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface ChatCompletionResponse {
  choices?: { finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }[];
}

export function createOpenAiProvider(config: OpenAiConfig): LlmProvider {
  const baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  const doFetch = config.fetchImpl ?? fetch;

  return {
    id: `openai:${config.model}`,
    async generateStructured(req: StructuredGenerationRequest): Promise<unknown> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), req.timeoutMs);
      let res: Response;
      try {
        res = await doFetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: "system", content: req.system },
              { role: "user", content: req.user },
            ],
            response_format: {
              type: "json_schema",
              json_schema: { name: req.schemaName, strict: true, schema: req.schema },
            },
            max_completion_tokens: req.maxOutputTokens,
          }),
        });
      } catch (error) {
        if (controller.signal.aborted) throw new ProviderError("timeout", "AI provider timed out.");
        throw new ProviderError("network", `AI provider unreachable: ${(error as Error).name}`);
      } finally {
        clearTimeout(timer);
      }

      // Deliberately don't include the response body in errors: it may echo request content.
      if (!res.ok) throw new ProviderError("http", `AI provider returned HTTP ${res.status}.`, res.status);

      let body: ChatCompletionResponse;
      try {
        body = (await res.json()) as ChatCompletionResponse;
      } catch {
        throw new ProviderError("invalid_json", "AI provider returned a non-JSON body.");
      }
      const choice = body.choices?.[0];
      if (choice?.message?.refusal) throw new ProviderError("refusal", "AI provider refused the request.");
      if (choice?.finish_reason === "length") throw new ProviderError("truncated", "AI response was truncated.");
      const content = choice?.message?.content;
      if (typeof content !== "string") throw new ProviderError("invalid_json", "AI response had no content.");
      try {
        return JSON.parse(content) as unknown;
      } catch {
        throw new ProviderError("invalid_json", "AI response content was not valid JSON.");
      }
    },
  };
}
