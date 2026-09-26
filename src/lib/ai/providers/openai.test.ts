import { describe, expect, it, vi } from "vitest";
import { createOpenAiProvider } from "./openai";
import { ProviderError, type StructuredGenerationRequest } from "./types";

const req: StructuredGenerationRequest = {
  system: "sys",
  user: "usr",
  schemaName: "decision_analysis",
  schema: { type: "object" },
  maxOutputTokens: 500,
  timeoutMs: 1_000,
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("OpenAI provider", () => {
  it("calls Chat Completions with a strict JSON schema and bearer auth", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ choices: [{ finish_reason: "stop", message: { content: '{"a":1}' } }] }));
    const provider = createOpenAiProvider({ apiKey: "sk-test-123", model: "gpt-test", fetchImpl });
    await expect(provider.generateStructured(req)).resolves.toEqual({ a: 1 });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test-123");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      model: "gpt-test",
      max_completion_tokens: 500,
      response_format: { type: "json_schema", json_schema: { name: "decision_analysis", strict: true } },
    });
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(["system", "user"]);
    expect(provider.id).toBe("openai:gpt-test");
    expect(provider.id).not.toContain("sk-");
  });

  it.each([
    ["HTTP errors", () => jsonResponse({ error: { message: "echo of prompt" } }, 500), "http"],
    ["refusals", () => jsonResponse({ choices: [{ message: { refusal: "no" } }] }), "refusal"],
    ["truncated output", () => jsonResponse({ choices: [{ finish_reason: "length", message: { content: '{"a":' } }] }), "truncated"],
    ["non-JSON content", () => jsonResponse({ choices: [{ finish_reason: "stop", message: { content: "Sure! Here's" } }] }), "invalid_json"],
    ["missing content", () => jsonResponse({ choices: [] }), "invalid_json"],
  ])("turns %s into a typed ProviderError without leaking the body", async (_label, make, kind) => {
    const provider = createOpenAiProvider({ apiKey: "k", model: "m", fetchImpl: vi.fn(async () => make()) });
    const err = await provider.generateStructured(req).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect((err as ProviderError).kind).toBe(kind);
    expect((err as Error).message).not.toContain("echo of prompt");
  });

  it("times out slow requests", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
    );
    const provider = createOpenAiProvider({ apiKey: "k", model: "m", fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(provider.generateStructured({ ...req, timeoutMs: 20 })).rejects.toMatchObject({ kind: "timeout" });
  });

  it("reports network failures", async () => {
    const provider = createOpenAiProvider({ apiKey: "k", model: "m", fetchImpl: vi.fn(async () => Promise.reject(new TypeError("fetch failed"))) });
    await expect(provider.generateStructured(req)).rejects.toMatchObject({ kind: "network" });
  });
});
