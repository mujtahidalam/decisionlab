/**
 * Database tests against a real Postgres engine (PGlite, in memory) with the
 * generated SQL migrations applied — the same schema production runs.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { calculators as registry } from "../calculators/registry";
import { DEFAULT_INPUTS, MASTERS_ROI_FORMULA_VERSION } from "../calculators/masters-roi/defaults";
import { buildMastersRoiSessionResults } from "../calculators/masters-roi/session-results";
import { loadSession, saveSession } from "../services/sessions";
import { connectPglite, type Connection } from "./connect";
import { getCalculatorBySlug, listCalculators } from "./repositories/calculators";
import { createSession, getSession, isSessionId } from "./repositories/sessions";
import { calculatorInputs, calculators, calculatorSessions } from "./schema";
import { buildSeedData, seedCalculators } from "./seed";

let conn: Connection;

beforeAll(async () => {
  conn = connectPglite("memory://");
  await conn.migrate();
  await seedCalculators(conn.db);
}, 30_000);

afterAll(async () => {
  await conn.close();
});

beforeEach(async () => {
  await conn.db.delete(calculatorSessions);
});

describe("migrations", () => {
  it("create the three tables", async () => {
    const result = await conn.db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    );
    const names = (result as unknown as { rows: { table_name: string }[] }).rows.map((r) => r.table_name);
    expect(names).toEqual(["calculator_inputs", "calculator_sessions", "calculators"]);
  });
});

describe("seed data", () => {
  it("has one calculator per registry entry", () => {
    expect(buildSeedData().map((s) => s.calculator.slug)).toEqual(registry.map((c) => c.slug));
  });

  it("stores validation rules in model units (percent as decimals)", () => {
    const growth = buildSeedData()[0]!.inputs.find((i) => i.fieldName === "salaryGrowthRate")!;
    expect(growth.fieldType).toBe("percent");
    expect(growth.defaultValue).toBe(0.03);
    expect(growth.validationRules).toEqual({ required: true, min: -0.1, max: 0.25, step: 0.005 });
  });
});

describe("calculators repository", () => {
  it("lists every seeded calculator", async () => {
    const rows = await listCalculators(conn.db);
    expect(rows.map((r) => r.slug)).toEqual(registry.map((c) => c.slug));
  });

  it("returns the Master's ROI calculator with its 8 inputs", async () => {
    const calc = await getCalculatorBySlug(conn.db, "masters-roi");
    expect(calc).toMatchObject({ slug: "masters-roi", status: "live", category: "Education", formulaVersion: MASTERS_ROI_FORMULA_VERSION });
    expect(calc!.inputs).toHaveLength(8);
    const byName = Object.fromEntries(calc!.inputs.map((i) => [i.fieldName, i]));
    expect(byName.tuition).toMatchObject({ fieldType: "currency", defaultValue: DEFAULT_INPUTS.tuition });
    expect(byName.jobSearchMonths!.validationRules).toEqual({ required: true, min: 0, max: 24, step: 1 });
  });

  it("stores coming-soon calculators without a formula version or inputs", async () => {
    const calc = await getCalculatorBySlug(conn.db, "rent-vs-buy");
    expect(calc).toMatchObject({ status: "coming-soon", formulaVersion: null, inputs: [] });
  });

  it("returns null for an unknown slug", async () => {
    expect(await getCalculatorBySlug(conn.db, "nope")).toBeNull();
  });
});

describe("seeding", () => {
  it("is idempotent: re-running keeps ids and row counts", async () => {
    const before = await listCalculators(conn.db);
    await seedCalculators(conn.db);
    const after = await listCalculators(conn.db);
    expect(after.map((c) => c.id)).toEqual(before.map((c) => c.id));
    const [{ count }] = (await conn.db.select({ count: sql<number>`count(*)::int` }).from(calculatorInputs)) as [{ count: number }];
    expect(count).toBe(8);
  });

  it("updates changed definitions in place", async () => {
    const data = buildSeedData();
    data[0]!.calculator.name = "Renamed";
    data[0]!.inputs = data[0]!.inputs.slice(0, 3);
    await seedCalculators(conn.db, data);
    const calc = await getCalculatorBySlug(conn.db, "masters-roi");
    expect(calc!.name).toBe("Renamed");
    expect(calc!.inputs).toHaveLength(3);
    await seedCalculators(conn.db); // restore
    expect((await getCalculatorBySlug(conn.db, "masters-roi"))!.inputs).toHaveLength(8);
  });
});

describe("sessions repository", () => {
  it("creates a session with a random UUID and a timestamp", async () => {
    const calc = (await getCalculatorBySlug(conn.db, "masters-roi"))!;
    const saved = await createSession(conn.db, { calculatorId: calc.id, inputs: { a: 1 }, results: { b: 2 } });
    expect(isSessionId(saved.id)).toBe(true);
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(await getSession(conn.db, saved.id)).toMatchObject({ calculatorSlug: "masters-roi", inputs: { a: 1 }, results: { b: 2 } });
  });

  it("returns null for unknown and malformed ids without querying badly", async () => {
    expect(await getSession(conn.db, "00000000-0000-4000-8000-000000000000")).toBeNull();
    expect(await getSession(conn.db, "not-a-uuid'; drop table calculators; --")).toBeNull();
  });

  it("enforces the calculator foreign key", async () => {
    await expect(createSession(conn.db, { calculatorId: 999_999, inputs: {}, results: {} })).rejects.toThrow();
  });

  it("prevents deleting a calculator that has saved sessions", async () => {
    const calc = (await getCalculatorBySlug(conn.db, "masters-roi"))!;
    await createSession(conn.db, { calculatorId: calc.id, inputs: {}, results: {} });
    await expect(conn.db.delete(calculators).where(eq(calculators.id, calc.id))).rejects.toThrow();
  });
});

describe("saveSession service", () => {
  const inputs = { ...DEFAULT_INPUTS, postDegreeSalary: 90_000 };

  it("validates, computes results on the server and stores both", async () => {
    const result = await saveSession(conn.db, "masters-roi", { inputs });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const session = await loadSession(conn.db, result.id);
    expect(session!.inputs).toEqual(inputs);
    expect(session!.results).toEqual(JSON.parse(JSON.stringify(buildMastersRoiSessionResults(inputs))));
    expect(session!.results.formulaVersion).toBe(MASTERS_ROI_FORMULA_VERSION);
  });

  it("ignores results sent by the client", async () => {
    const result = await saveSession(conn.db, "masters-roi", { inputs, results: { impact10Year: 1e12 } });
    if (!result.ok) throw new Error("expected ok");
    const session = await loadSession(conn.db, result.id);
    const scenarios = session!.results.scenarios as Record<string, { impact10Year: number }>;
    expect(scenarios.expected!.impact10Year).not.toBe(1e12);
  });

  it("rejects bodies without an inputs object", async () => {
    expect(await saveSession(conn.db, "masters-roi", null)).toMatchObject({ ok: false, status: 400 });
    expect(await saveSession(conn.db, "masters-roi", { foo: 1 })).toMatchObject({ ok: false, status: 400 });
    expect(await saveSession(conn.db, "masters-roi", { inputs: [1, 2] })).toMatchObject({ ok: false, status: 400 });
  });

  it("returns per-field errors for invalid inputs and stores nothing", async () => {
    const result = await saveSession(conn.db, "masters-roi", { inputs: { ...inputs, tuition: -5, extra: 1 } });
    expect(result).toMatchObject({ ok: false, status: 400 });
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors!)).toEqual(expect.arrayContaining(["extra"]));
    const [{ count }] = (await conn.db.select({ count: sql<number>`count(*)::int` }).from(calculatorSessions)) as [{ count: number }];
    expect(count).toBe(0);
  });

  it("returns 404 for unknown and model-less calculators", async () => {
    expect(await saveSession(conn.db, "nope", { inputs })).toMatchObject({ ok: false, status: 404 });
    expect(await saveSession(conn.db, "rent-vs-buy", { inputs })).toMatchObject({ ok: false, status: 404 });
  });

  it("returns 409 when the calculator is not live", async () => {
    await conn.db.update(calculators).set({ status: "retired" }).where(eq(calculators.slug, "masters-roi"));
    try {
      expect(await saveSession(conn.db, "masters-roi", { inputs })).toMatchObject({ ok: false, status: 409 });
    } finally {
      await seedCalculators(conn.db);
    }
  });
});
