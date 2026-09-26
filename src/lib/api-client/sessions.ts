/**
 * Browser-side client for the sessions API. Thin wrappers around fetch that
 * return typed results instead of throwing on HTTP errors.
 */

export interface SavedSessionPayload {
  id: string;
  calculatorSlug: string;
  inputs: Record<string, number>;
  results: Record<string, unknown>;
  createdAt: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, init);
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) return { ok: false, error: body.error ?? `Request failed (${res.status}).` };
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: "Network error — check your connection and try again." };
  }
}

export function saveCalculatorSession(slug: string, inputs: Record<string, number>) {
  return request<{ id: string; createdAt: string; warnings: string[] }>(
    `/api/calculators/${encodeURIComponent(slug)}/sessions`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inputs }) },
  );
}

export async function fetchCalculatorSession(id: string): Promise<ApiResult<SavedSessionPayload>> {
  const result = await request<{ session: SavedSessionPayload }>(`/api/sessions/${encodeURIComponent(id)}`);
  return result.ok ? { ok: true, data: result.data.session } : result;
}
