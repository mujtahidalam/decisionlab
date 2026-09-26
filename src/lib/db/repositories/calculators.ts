import { asc, eq } from "drizzle-orm";
import { calculatorInputs, calculators, type Calculator, type CalculatorInput } from "../schema";
import type { Database } from "../types";

export interface CalculatorWithInputs extends Calculator {
  inputs: Omit<CalculatorInput, "calculatorId">[];
}

export async function listCalculators(db: Database): Promise<Calculator[]> {
  return db.select().from(calculators).orderBy(asc(calculators.id));
}

export async function getCalculatorBySlug(db: Database, slug: string): Promise<CalculatorWithInputs | null> {
  const [calculator] = await db.select().from(calculators).where(eq(calculators.slug, slug)).limit(1);
  if (!calculator) return null;
  const inputs = await db
    .select({
      fieldName: calculatorInputs.fieldName,
      fieldType: calculatorInputs.fieldType,
      defaultValue: calculatorInputs.defaultValue,
      validationRules: calculatorInputs.validationRules,
    })
    .from(calculatorInputs)
    .where(eq(calculatorInputs.calculatorId, calculator.id))
    .orderBy(asc(calculatorInputs.fieldName));
  return { ...calculator, inputs };
}
