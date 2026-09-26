/**
 * Database CLI.
 *   npm run db:migrate   apply SQL migrations from /drizzle
 *   npm run db:seed      mirror calculator definitions from code into the DB
 *   npm run db:setup     both (run on every deploy)
 * Uses DATABASE_URL when set, otherwise the local PGlite database.
 */

import { connectFromEnv } from "../src/lib/db/connect";
import { seedCalculators } from "../src/lib/db/seed";

const command = process.argv[2];

async function main() {
  if (!["migrate", "seed", "setup"].includes(command ?? "")) {
    console.error("Usage: tsx scripts/db.ts <migrate|seed|setup>");
    process.exit(1);
  }
  const connection = connectFromEnv();
  console.log(`Using ${connection.driver === "postgres" ? "PostgreSQL (DATABASE_URL)" : "local PGlite (.data/pglite)"}`);
  try {
    if (command === "migrate" || command === "setup") {
      await connection.migrate();
      console.log("✓ Migrations applied");
    }
    if (command === "seed" || command === "setup") {
      await seedCalculators(connection.db);
      console.log("✓ Calculators seeded");
    }
  } finally {
    await connection.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
