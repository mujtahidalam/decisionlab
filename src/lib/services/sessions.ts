/**
 * Saving and loading calculator sessions. Framework-agnostic: route handlers
 * translate these results into HTTP responses, and tests call them directly
 * against an in-memory database.
 */

import { getCalculatorDefinition } from "../calculators/definitions";
import { getCalculatorBySlug } from "../db/repositories/calculators";
import { createSession, getSession, type SavedSession } from "../db/repositories/sessions";
import type { Database } from "../db/types";

export type SaveSessionResult =
  | { ok: true; id: string; createdAt: Date; warnings: string[] }
  | { ok: false; status: 400 | 404 | 409; error: string; fieldErrors?: Record<string, string> };

/**
 * Validates `body.inputs`, recomputes results on the server with the
 * deterministic engine and stores both. Any `results` in the body are ignored.
 */
export async function saveSession(db: Database, slug: string, body: unknown): Promise<SaveSessionResult> {
  const definition = getCalculatorDefinition(slug);
  if (!definition) return { ok: false, status: 404, error: `Unknown calculator "${slug}".` };

  const calculator = await getCalculatorBySlug(db, slug);
  if (!calculator) return { ok: false, status: 404, error: `Unknown calculator "${slug}".` };
  if (calculator.status !== "live") return { ok: false, status: 409, error: `Calculator "${slug}" is not live.` };

  if (typeof body !== "object" || body === null || !("inputs" in body)) {
    return { ok: false, status: 400, error: 'Request body must be a JSON object with an "inputs" object.' };
  }
  const parsed = definition.parseInputs((body as { inputs: unknown }).inputs);
  if (!parsed.ok) return { ok: false, status: 400, error: "Invalid inputs.", fieldErrors: parsed.errors };

  const results = definition.computeSessionResults(parsed.inputs);
  const saved = await createSession(db, { calculatorId: calculator.id, inputs: parsed.inputs, results });
  return { ok: true, id: saved.id, createdAt: saved.createdAt, warnings: parsed.warnings };
}

export async function loadSession(db: Database, id: string): Promise<SavedSession | null> {
  return getSession(db, id);
}
