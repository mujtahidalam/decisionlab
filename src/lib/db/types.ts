import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * A Drizzle database handle for either driver (PGlite locally/in tests,
 * node-postgres in production). Repositories accept this type so they can be
 * exercised against a real in-memory Postgres in unit tests.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
