// @vitest-environment jsdom
/**
 * Integration test: the deterministic calculator keeps working when the AI
 * service is unavailable, and AI failures never touch the calculated results.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AI_UNAVAILABLE_MESSAGE } from "@/components/calculator/AiAnalysisPanel";
import { MastersRoiCalculator } from "./MastersRoiCalculator";

beforeAll(() => {
  // jsdom lacks ResizeObserver (used by the chart).
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Reads a headline metric from the "Key results" grid. */
const stat = (label: string) => {
  const grid = screen.getByRole("region", { name: "Key results" });
  return within(within(grid).getByText(label, { selector: "dt" }).parentElement!).getAllByRole("definition")[0]!.textContent;
};

describe("MastersRoiCalculator with AI unavailable", () => {
  it("shows deterministic results, degrades gracefully on AI failure, and keeps recalculating", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "down" }), { status: 503 })));
    render(<MastersRoiCalculator />);

    expect(stat("Net investment")).toBe("$177,650");
    expect(stat("10-year impact")).toBe("+$13,229");

    fireEvent.click(screen.getByRole("button", { name: /Analyze My Result/ }));
    await waitFor(() => expect(screen.getByText(AI_UNAVAILABLE_MESSAGE)).toBeTruthy());

    // Results are untouched by the failure…
    expect(stat("Net investment")).toBe("$177,650");

    // …and the calculator still recalculates on input changes.
    fireEvent.change(screen.getByLabelText("Tuition (whole program)"), { target: { value: "50000" } });
    await waitFor(() => expect(stat("Net investment")).toBe("$187,650"));
  });

  it("disables AI analysis while inputs are invalid", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<MastersRoiCalculator />);
    fireEvent.change(screen.getByLabelText("Tuition (whole program)"), { target: { value: "-1" } });
    expect((screen.getByRole("button", { name: /Analyze My Result/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Fix the highlighted inputs to analyze your result.")).toBeTruthy();
  });
});
