import { getDb } from "@/lib/db/client";
import { jsonError, readJsonBody, withErrorHandling } from "@/lib/http";
import { saveSession } from "@/lib/services/sessions";

/**
 * POST /api/calculators/:slug/sessions — save a calculation.
 * Body: { "inputs": { ...model-unit values } }. Results are computed on the server.
 * 201 → { id, createdAt, warnings }
 */
export const POST = withErrorHandling(async function post(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const result = await saveSession(await getDb(), slug, body.value);
  if (!result.ok) return jsonError(result.status, result.error, result.fieldErrors ? { fieldErrors: result.fieldErrors } : {});
  return Response.json(
    { id: result.id, createdAt: result.createdAt, warnings: result.warnings },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
});
