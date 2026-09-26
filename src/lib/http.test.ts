import { describe, expect, it, vi } from "vitest";
import { MAX_JSON_BODY_BYTES, readJsonBody } from "./http";

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://x/api", { method: "POST", body, headers });

describe("readJsonBody", () => {
  it("parses valid JSON", async () => {
    expect(await readJsonBody(post('{"a":1}'))).toEqual({ ok: true, value: { a: 1 } });
  });

  it("rejects invalid JSON with 400", async () => {
    const r = await readJsonBody(post("{nope"));
    expect(r.ok === false && r.response.status).toBe(400);
  });

  it("rejects oversized bodies with 413", async () => {
    const r = await readJsonBody(post(JSON.stringify({ x: "a".repeat(MAX_JSON_BODY_BYTES) })));
    expect(r.ok === false && r.response.status).toBe(413);
    const declared = await readJsonBody(post("{}", { "content-length": String(MAX_JSON_BODY_BYTES + 1) }));
    expect(declared.ok === false && declared.response.status).toBe(413);
  });
});

describe("withErrorHandling", () => {
  it("turns thrown errors into a JSON 500 without leaking details", async () => {
    const { withErrorHandling } = await import("./http");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = withErrorHandling(async () => {
      throw new Error("connection refused at 10.0.0.5");
    });
    const res = await handler();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("10.0.0.5");
    spy.mockRestore();
  });
});
