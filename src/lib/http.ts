/** Small helpers for JSON route handlers. */

export const MAX_JSON_BODY_BYTES = 16 * 1024;

export function jsonError(status: number, error: string, extra: Record<string, unknown> = {}): Response {
  return Response.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Reads a JSON body with a size cap. Returns undefined when the body is not valid JSON. */
export async function readJsonBody(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_JSON_BODY_BYTES) return { ok: false, response: jsonError(413, "Request body too large.") };
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_JSON_BODY_BYTES) {
    return { ok: false, response: jsonError(413, "Request body too large.") };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, response: jsonError(400, "Request body must be valid JSON.") };
  }
}

/**
 * Wraps a route handler so unexpected errors (e.g. the database is down)
 * return a JSON 500 without leaking internals, and are logged on the server.
 */
export function withErrorHandling<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("[api] unhandled error", error);
      return jsonError(500, "Something went wrong. Please try again.");
    }
  };
}
