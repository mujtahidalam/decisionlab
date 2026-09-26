/**
 * The application's database handle (server only).
 *
 * - With DATABASE_URL set: connects to PostgreSQL. Run `npm run db:setup`
 *   (migrate + seed) as part of each deploy.
 * - Without it: starts an embedded PGlite database under .data/pglite and
 *   migrates + seeds it automatically, so `npm run dev` needs no setup.
 *
 * One connection is cached per process (and across dev hot reloads).
 */

import "server-only";
import { connectFromEnv, type Connection } from "./connect";
import { seedCalculators } from "./seed";
import type { Database } from "./types";

const globalForDb = globalThis as unknown as { __decisionlensDb?: Promise<Connection> };

async function init(): Promise<Connection> {
  const connection = connectFromEnv();
  if (connection.driver === "pglite") {
    await connection.migrate();
    await seedCalculators(connection.db);
  }
  return connection;
}

export async function getDb(): Promise<Database> {
  globalForDb.__decisionlensDb ??= init().catch((error: unknown) => {
    globalForDb.__decisionlensDb = undefined; // allow a retry on the next request
    throw error;
  });
  return (await globalForDb.__decisionlensDb).db;
}
