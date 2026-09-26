import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit configuration. `npm run db:generate` diffs src/lib/db/schema.ts
 * against the migrations in ./drizzle and writes a new SQL migration.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://localhost:5432/decisionlens" },
  strict: true,
  verbose: true,
});
