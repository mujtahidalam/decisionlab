/**
 * Server-side AI configuration from environment variables. Import only from
 * server code (route handlers). The API key is never sent to the browser:
 * it is not prefixed with NEXT_PUBLIC_ and is only read here.
 */

import "server-only";
import { createOpenAiProvider } from "./providers/openai";
import type { LlmProvider } from "./providers/types";

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

/** Returns the configured provider, or null when AI analysis is not configured. */
export function getAnalysisProvider(env: NodeJS.ProcessEnv = process.env): LlmProvider | null {
  if (env.AI_ANALYSIS_ENABLED === "false") return null;
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return createOpenAiProvider({
    apiKey,
    model: env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
    baseUrl: env.OPENAI_BASE_URL?.trim() || undefined,
  });
}
