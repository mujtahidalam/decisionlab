import { eq } from "drizzle-orm";
import { calculatorSessions, calculators } from "../schema";
import type { Database } from "../types";

export interface SavedSession {
  id: string;
  calculatorSlug: string;
  inputs: Record<string, number>;
  results: Record<string, unknown>;
  createdAt: Date;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSessionId(value: string): boolean {
  return UUID_RE.test(value);
}

export async function createSession(
  db: Database,
  params: { calculatorId: number; inputs: Record<string, number>; results: Record<string, unknown> },
): Promise<{ id: string; createdAt: Date }> {
  const [row] = await db
    .insert(calculatorSessions)
    .values(params)
    .returning({ id: calculatorSessions.id, createdAt: calculatorSessions.createdAt });
  return row!;
}

/** Returns null for unknown or malformed ids (never throws on bad input). */
export async function getSession(db: Database, id: string): Promise<SavedSession | null> {
  if (!isSessionId(id)) return null;
  const [row] = await db
    .select({
      id: calculatorSessions.id,
      calculatorSlug: calculators.slug,
      inputs: calculatorSessions.inputs,
      results: calculatorSessions.results,
      createdAt: calculatorSessions.createdAt,
    })
    .from(calculatorSessions)
    .innerJoin(calculators, eq(calculators.id, calculatorSessions.calculatorId))
    .where(eq(calculatorSessions.id, id))
    .limit(1);
  return row ?? null;
}
