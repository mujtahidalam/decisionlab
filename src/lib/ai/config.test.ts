import { describe, expect, it } from "vitest";
import { DEFAULT_OPENAI_MODEL, getAnalysisProvider } from "./config";
import { createRateLimiter } from "./rate-limit";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("getAnalysisProvider", () => {
  it("is disabled without an API key or when switched off", () => {
    expect(getAnalysisProvider(env({}))).toBeNull();
    expect(getAnalysisProvider(env({ OPENAI_API_KEY: "  " }))).toBeNull();
    expect(getAnalysisProvider(env({ OPENAI_API_KEY: "sk-x", AI_ANALYSIS_ENABLED: "false" }))).toBeNull();
  });

  it("uses the configured or default model", () => {
    expect(getAnalysisProvider(env({ OPENAI_API_KEY: "sk-x" }))!.id).toBe(`openai:${DEFAULT_OPENAI_MODEL}`);
    expect(getAnalysisProvider(env({ OPENAI_API_KEY: "sk-x", OPENAI_MODEL: "gpt-custom" }))!.id).toBe("openai:gpt-custom");
  });
});

describe("rate limiter", () => {
  it("allows `limit` requests per window per key", () => {
    const rl = createRateLimiter({ limit: 2, windowMs: 1_000 });
    expect([rl.take("a", 0), rl.take("a", 10), rl.take("a", 20)]).toEqual([true, true, false]);
    expect(rl.take("b", 20)).toBe(true);
    expect(rl.take("a", 1_000)).toBe(true);
  });
});
