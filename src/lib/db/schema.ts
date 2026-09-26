/**
 * Database schema (PostgreSQL, via Drizzle ORM).
 *
 *   calculators          one row per calculator in the product
 *   calculator_inputs    the input fields each calculator accepts
 *   calculator_sessions  a saved calculation: the inputs a user entered and
 *                        the results the engine produced for them
 *
 * Code remains the source of truth for calculator definitions
 * (src/lib/calculators/registry.ts and each calculator's fields.ts); the
 * `calculators` and `calculator_inputs` tables are a mirror of it, kept in sync
 * by `npm run db:seed`. SQL migrations are generated into /drizzle with
 * `npm run db:generate` — never edit a generated migration by hand.
 */

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const calculatorStatus = pgEnum("calculator_status", ["draft", "coming-soon", "live", "retired"]);

export const fieldType = pgEnum("field_type", ["currency", "percent", "years", "months"]);

/** Validation rules for one input, in model units (percent fields as decimals: 0.03 = 3%). */
export interface ValidationRules {
  required: boolean;
  min: number;
  max: number;
  step: number;
}

export const calculators = pgTable("calculators", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  /** Semantic version of the calculation model; null until a calculator has a model. */
  formulaVersion: text("formula_version"),
  status: calculatorStatus("status").notNull().default("draft"),
});

export const calculatorInputs = pgTable(
  "calculator_inputs",
  {
    calculatorId: integer("calculator_id")
      .notNull()
      .references(() => calculators.id, { onDelete: "cascade" }),
    fieldName: text("field_name").notNull(),
    fieldType: fieldType("field_type").notNull(),
    /** Default in model units. JSON so future non-numeric fields fit without a migration. */
    defaultValue: jsonb("default_value").$type<number>().notNull(),
    validationRules: jsonb("validation_rules").$type<ValidationRules>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.calculatorId, t.fieldName] })],
);

export const calculatorSessions = pgTable(
  "calculator_sessions",
  {
    /** Random UUID: unguessable, so a saved session link can't be enumerated. */
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    calculatorId: integer("calculator_id")
      .notNull()
      .references(() => calculators.id, { onDelete: "restrict" }),
    inputs: jsonb("inputs").$type<Record<string, number>>().notNull(),
    results: jsonb("results").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("calculator_sessions_calculator_created_idx").on(t.calculatorId, t.createdAt)],
);

export type Calculator = typeof calculators.$inferSelect;
export type NewCalculator = typeof calculators.$inferInsert;
export type CalculatorInput = typeof calculatorInputs.$inferSelect;
export type NewCalculatorInput = typeof calculatorInputs.$inferInsert;
export type CalculatorSession = typeof calculatorSessions.$inferSelect;
export type NewCalculatorSession = typeof calculatorSessions.$inferInsert;
