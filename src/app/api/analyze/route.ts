import { getAnalysisProvider } from "@/lib/ai/config";
import { createRateLimiter } from "@/lib/ai/rate-limit";
import { jsonError, readJsonBody, withErrorHandling } from "@/lib/http";
import { runAnalysis } from "@/lib/services/analysis";

/** Cost control: at most 10 analyses per client per 10 minutes (per server instance). */
const limiter = createRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 });

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
}

/**
 * POST /api/analyze — AI interpretation of a calculator result.
 * Body: { "calculator": "masters-roi", "inputs": {...}, "currency": "USD" }
 * The server recomputes all results deterministically; the AI only explains them.
 */
export const POST = withErrorHandling(async function post(request: Request) {
  if (!limiter.take(clientKey(request))) {
    return jsonError(429, "Too many analysis requests. Please try again in a few minutes.", { code: "rate_limited" });
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const result = await runAnalysis(body.value, getAnalysisProvider());
  if (!result.ok) {
    return jsonError(result.status, result.error, { code: result.code, ...(result.fieldErrors ? { fieldErrors: result.fieldErrors } : {}) });
  }
  return Response.json({ analysis: result.analysis, meta: result.meta }, { headers: { "Cache-Control": "no-store" } });
});
