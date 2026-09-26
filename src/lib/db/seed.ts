/**
 * Mirrors calculator definitions from code into the database.
 *
 * Idempotent: calculators are upserted by slug and each calculator's input
 * rows are replaced, all in one transaction. Safe to run on every deploy.
 */

import { eq, sql } from "drizzle-orm";
import { getCalculatorDefinition, modelValidationRules } from "../calculators/definitions";
import { calculators as registry } from "../calculators/registry";
import { calculatorInputs, calculators, type NewCalculator, type NewCalculatorInput } from "./schema";
import type { Database } from "./types";

export interface SeedCalculator {
  calculator: NewCalculator;
  inputs: Omit<NewCalculatorInput, "calculatorId">[];
}

/** Builds seed rows from the registry and calculator definitions (pure; unit-tested). */
export function buildSeedData(): SeedCalculator[] {
  return registry.map((meta) => {
    const def = getCalculatorDefinition(meta.slug);
    return {
      calculator: {
        slug: meta.slug,
        name: meta.name,
        description: meta.description,
        category: meta.category,
        formulaVersion: def?.formulaVersion ?? null,
        status: meta.status,
      },
      inputs: (def?.fields ?? []).map((field) => ({
        fieldName: field.key,
        fieldType: field.unit,
        defaultValue: def!.defaults[field.key]!,
        validationRules: modelValidationRules(field),
      })),
    };
  });
}

export async function seedCalculators(db: Database, data: SeedCalculator[] = buildSeedData()): Promise<void> {
  await db.transaction(async (tx) => {
    for (const { calculator, inputs } of data) {
      const [row] = await tx
        .insert(calculators)
        .values(calculator)
        .onConflictDoUpdate({
          target: calculators.slug,
          set: {
            name: sql`excluded.name`,
            description: sql`excluded.description`,
            category: sql`excluded.category`,
            formulaVersion: sql`excluded.formula_version`,
            status: sql`excluded.status`,
          },
        })
        .returning({ id: calculators.id });
      await tx.delete(calculatorInputs).where(eq(calculatorInputs.calculatorId, row!.id));
      if (inputs.length > 0) {
        await tx.insert(calculatorInputs).values(inputs.map((input) => ({ ...input, calculatorId: row!.id })));
      }
    }
  });
}
