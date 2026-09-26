import { describe, expect, it } from "vitest";
import { AnalysisError, analyzeDecision } from "./analyzeDecision";
import { SYSTEM_PROMPT } from "./prompt";
import { ProviderError } from "./providers/types";
import { defaultContext, fakeProvider, validAnalysis } from "./test-fixtures";

describe("analyzeDecision", () => {
  it("sends the system rules and the deterministic context, and returns the validated analysis", async () => {
    const provider = fakeProvider(() => validAnalysis());
    const context = defaultContext();
    const result = await analyzeDecision({ context, provider });
    expect(result).toEqual(validAnalysis());

    const req = provider.calls[0]!;
    expect(req.system).toBe(SYSTEM_PROMPT);
    expect(req.system).toMatch(/Never recalculate numerical values/);
    expect(req.user).toContain(JSON.stringify(context));
    expect(req.schemaName).toBe("decision_analysis");
    expect(req.maxOutputTokens).toBeLessThanOrEqual(1000);
  });

  it("keeps the prompt compact", async () => {
    const provider = fakeProvider(() => validAnalysis());
    await analyzeDecision({ context: defaultContext(), provider });
    const size = provider.calls[0]!.system.length + provider.calls[0]!.user.length;
    expect(size).toBeLessThan(9_000); // ≈ 2–3k tokens
  });

  it("maps provider failures to provider_error", async () => {
    const provider = fakeProvider(() => {
      throw new ProviderError("http", "AI provider returned HTTP 500.", 500);
    });
    await expect(analyzeDecision({ context: defaultContext(), provider })).rejects.toMatchObject({ code: "provider_error" });
  });

  it("maps unparseable provider output to invalid_response", async () => {
    const provider = fakeProvider(() => {
      throw new ProviderError("invalid_json", "not JSON");
    });
    await expect(analyzeDecision({ context: defaultContext(), provider })).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("rejects responses that don't match the schema", async () => {
    const provider = fakeProvider(() => ({ summary: "ok" }));
    const err = await analyzeDecision({ context: defaultContext(), provider }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AnalysisError);
    expect((err as AnalysisError).code).toBe("invalid_response");
  });

  it("rejects responses containing numbers the calculator didn't produce", async () => {
    const provider = fakeProvider(() => ({ ...validAnalysis(), summary: "Break-even takes about 7 years." }));
    await expect(analyzeDecision({ context: defaultContext(), provider })).rejects.toMatchObject({ code: "unverified_numbers" });
  });
});
