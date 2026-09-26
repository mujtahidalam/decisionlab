/** Browser client for POST /api/analyze. Returns a typed result instead of throwing. */

import type { DecisionAnalysis } from "@/lib/ai/types";
import type { ApiResult } from "./sessions";

export interface AnalyzeRequest {
  calculator: string;
  inputs: Record<string, number>;
  currency: string;
}

export async function requestAnalysis(body: AnalyzeRequest, signal?: AbortSignal): Promise<ApiResult<DecisionAnalysis>> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const data = (await res.json().catch(() => null)) as { analysis?: DecisionAnalysis; error?: string } | null;
    if (!res.ok || !data?.analysis) return { ok: false, error: data?.error ?? `Request failed (${res.status}).` };
    return { ok: true, data: data.analysis };
  } catch {
    return { ok: false, error: "Network error." };
  }
}
