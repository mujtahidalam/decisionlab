/**
 * Low-level connection helpers shared by the app, CLI scripts and tests.
 * (The app itself goes through ./client.ts, which caches one connection.)
 */

import { mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { migrate as migratePostgres } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import * as schema from "./schema";
import type { Database } from "./types";

export const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

export interface Connection {
  db: Database;
  driver: "postgres" | "pglite";
  /** Applies all pending SQL migrations from /drizzle. */
  migrate: () => Promise<void>;
  close: () => Promise<void>;
}

/** Connects to a PostgreSQL server (production). */
export function connectPostgres(url: string): Connection {
  const pool = new Pool({ connectionString: url, max: Number(process.env.DATABASE_POOL_MAX ?? 10) });
  const db = drizzlePostgres(pool, { schema });
  return {
    db: db as unknown as Database,
    driver: "postgres",
    migrate: () => migratePostgres(db, { migrationsFolder: MIGRATIONS_FOLDER }),
    close: () => pool.end(),
  };
}

/**
 * Starts an embedded PGlite database (Postgres compiled to WebAssembly).
 * @param dataDir a directory for on-disk persistence, or "memory://" for tests.
 */
export function connectPglite(dataDir: string): Connection {
  // PGlite creates its data directory but not missing parents (e.g. .data/ on a fresh checkout).
  if (!dataDir.includes("://")) mkdirSync(path.dirname(path.resolve(dataDir)), { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });
  return {
    db: db as unknown as Database,
    driver: "pglite",
    migrate: () => migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER }),
    close: () => client.close(),
  };
}

/** DATABASE_URL → Postgres; otherwise a local PGlite database in PGLITE_DATA_DIR (default .data/pglite). */
export function connectFromEnv(env: NodeJS.ProcessEnv = process.env): Connection {
  const url = env.DATABASE_URL?.trim();
  if (url) return connectPostgres(url);
  return connectPglite(env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite"));
}
