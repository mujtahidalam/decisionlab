/**
 * API tests for POST /api/analyze. The OpenAI HTTP call is replaced with a
 * stubbed global fetch, so these run offline and exercise the real route,
 * validation, engine, provider and response checks end to end.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_INPUTS } from "@/lib/calculators/masters-roi/defaults";
import { validAnalysis } from "@/lib/ai/test-fixtures";
import { POST } from "./route";

let ip = 0;
const post = (body: unknown, raw?: string) =>
  POST(
    new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${++ip % 250}` },
      body: raw ?? JSON.stringify(body),
    }),
  );

const openAiReturns = (content: unknown, status = 200) =>
  vi.fn(async () =>
    new Response(JSON.stringify(status === 200 ? { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }] } : { error: {} }), {
      status,
    }),
  );

const validBody = { calculator: "masters-roi", inputs: { ...DEFAULT_INPUTS }, currency: "USD" };

beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "sk-test-secret");
  vi.stubEnv("OPENAI_MODEL", "gpt-test");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/analyze", () => {
  it("returns a validated analysis for a valid request", async () => {
    const fetchMock = openAiReturns(validAnalysis());
    vi.stubGlobal("fetch", fetchMock);
    const res = await post(validBody);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis).toEqual(validAnalysis());
    expect(body.meta).toMatchObject({ calculator: "masters-roi", formulaVersion: "1.0.0", provider: "openai:gpt-test" });
    expect(JSON.stringify(body)).not.toContain("sk-test-secret");
  });

  it("accepts the snake_case calculator id", async () => {
    vi.stubGlobal("fetch", openAiReturns(validAnalysis()));
    expect((await post({ ...validBody, calculator: "masters_roi" })).status).toBe(200);
  });

  it("sends the AI server-computed numbers and ignores client-supplied results", async () => {
    const fetchMock = openAiReturns(validAnalysis());
    vi.stubGlobal("fetch", fetchMock);
    await post({ ...validBody, results: { ten_year_impact: 999_999_999 }, sensitivity: { tuition: "high" } });
    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    const userMessage: string = sent.messages[1].content;
    expect(userMessage).toContain("$177,650");
    expect(userMessage).not.toContain("999");
  });

  it.each([
    ["missing inputs", { calculator: "masters-roi" }],
    ["missing calculator", { inputs: DEFAULT_INPUTS }],
    ["a non-object body", [1, 2, 3]],
    ["an unsupported currency", { ...validBody, currency: "XYZ" }],
  ])("rejects %s with 400", async (_label, body) => {
    vi.stubGlobal("fetch", openAiReturns(validAnalysis()));
    const res = await post(body);
    expect(res.status).toBe(400);
  });

  it("rejects malformed inputs with field errors, without calling the AI", async () => {
    const fetchMock = openAiReturns(validAnalysis());
    vi.stubGlobal("fetch", fetchMock);
    const res = await post({ ...validBody, inputs: { ...DEFAULT_INPUTS, currentSalary: "lots", extra: 1 } });
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).fieldErrors).sort()).toEqual(["currentSalary", "extra"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects out-of-range inputs (invalid calculator state) without calling the AI", async () => {
    const fetchMock = openAiReturns(validAnalysis());
    vi.stubGlobal("fetch", fetchMock);
    const res = await post({ ...validBody, inputs: { ...DEFAULT_INPUTS, tuition: -5, studyDurationYears: 40 } });
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).fieldErrors).sort()).toEqual(["studyDurationYears", "tuition"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400 and oversized bodies with 413", async () => {
    expect((await post(null, "{not json")).status).toBe(400);
    expect((await post({ ...validBody, padding: "x".repeat(20_000) })).status).toBe(413);
  });

  it("returns 404 for an unknown calculator", async () => {
    vi.stubGlobal("fetch", openAiReturns(validAnalysis()));
    expect((await post({ ...validBody, calculator: "crypto-moonshot" })).status).toBe(404);
  });

  it("returns a graceful 502 when the AI provider fails", async () => {
    vi.stubGlobal("fetch", openAiReturns(null, 500));
    const res = await post(validBody);
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ code: "ai_unavailable", error: "AI analysis is temporarily unavailable." });
  });

  it("returns a graceful 502 when the AI response is malformed", async () => {
    vi.stubGlobal("fetch", openAiReturns({ summary: "only a summary" }));
    expect((await post(validBody)).status).toBe(502);
  });

  it("returns a graceful 502 when the AI invents numbers", async () => {
    vi.stubGlobal("fetch", openAiReturns({ ...validAnalysis(), summary: "You'll break even in about 6 years." }));
    expect((await post(validBody)).status).toBe(502);
  });

  it("returns 503 when AI is not configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetchMock = openAiReturns(validAnalysis());
    vi.stubGlobal("fetch", fetchMock);
    const res = await post(validBody);
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never logs inputs or AI content on failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", openAiReturns(null, 500));
    await post(validBody);
    const logged = JSON.stringify(warn.mock.calls);
    expect(logged).not.toContain("55000");
    expect(logged).not.toContain("sk-test-secret");
  });

  it("rate-limits repeated requests from one client", async () => {
    vi.stubGlobal("fetch", openAiReturns(validAnalysis()));
    const req = () =>
      POST(new Request("http://localhost/api/analyze", { method: "POST", headers: { "x-forwarded-for": "203.0.113.9" }, body: JSON.stringify(validBody) }));
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await req()).status);
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
