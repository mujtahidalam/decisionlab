import { getDb } from "@/lib/db/client";
import { jsonError, withErrorHandling } from "@/lib/http";
import { loadSession } from "@/lib/services/sessions";

/** GET /api/sessions/:id — a saved calculation (inputs + server-computed results). */
export const GET = withErrorHandling(async function get(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await loadSession(await getDb(), id);
  if (!session) return jsonError(404, "Session not found.");
  // Saved sessions never change, so they can be cached aggressively.
  return Response.json({ session }, { headers: { "Cache-Control": "public, max-age=3600, immutable" } });
});
