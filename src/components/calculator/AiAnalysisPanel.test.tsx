// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { validAnalysis } from "@/lib/ai/test-fixtures";
import { DEFAULT_INPUTS } from "@/lib/calculators/masters-roi/defaults";
import { AI_DISCLAIMER, AI_UNAVAILABLE_MESSAGE, AiAnalysisPanel } from "./AiAnalysisPanel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const ok = () => new Response(JSON.stringify({ analysis: validAnalysis() }), { status: 200 });
const fail = () => new Response(JSON.stringify({ error: "AI analysis is temporarily unavailable." }), { status: 502 });

function renderPanel(props: Partial<Parameters<typeof AiAnalysisPanel>[0]> = {}) {
  return render(<AiAnalysisPanel calculator="masters-roi" inputs={{ ...DEFAULT_INPUTS }} currency="USD" disabled={false} {...props} />);
}

describe("AiAnalysisPanel", () => {
  it("shows the Analyze button and the disclaimer, and makes no request until clicked", () => {
    const fetchMock = vi.fn(ok);
    vi.stubGlobal("fetch", fetchMock);
    renderPanel();
    expect(screen.getByRole("button", { name: /Analyze My Result/ })).toBeTruthy();
    expect(screen.getByText(AI_DISCLAIMER)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is disabled while the calculator has invalid inputs", () => {
    const fetchMock = vi.fn(ok);
    vi.stubGlobal("fetch", fetchMock);
    renderPanel({ disabled: true });
    const button = screen.getByRole("button", { name: /Analyze My Result/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a loading state, sends only calculator/inputs/currency, then renders every report section", async () => {
    let resolve!: (r: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((r) => (resolve = r)));
    vi.stubGlobal("fetch", fetchMock);
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /Analyze My Result/ }));
    expect(screen.getByText("Analyzing your results...")).toBeTruthy();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/analyze");
    expect(Object.keys(JSON.parse(init.body as string)).sort()).toEqual(["calculator", "currency", "inputs"]);

    await act(async () => resolve(ok()));
    for (const heading of ["What the numbers suggest", "Key drivers", "What could change the result?", "Sensitivity", "Assumptions", "Questions worth considering"]) {
      expect(screen.getByText(heading)).toBeTruthy();
    }
    expect(screen.getByText(validAnalysis().summary)).toBeTruthy();
    expect(screen.getByText(validAnalysis().questions_to_consider[0]!)).toBeTruthy();
    expect(screen.queryByText("Analyzing your results...")).toBeNull();
    expect((screen.getByRole("button", { name: /Analysis up to date/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the unavailable message on API failure and can retry", async () => {
    const fetchMock = vi.fn(fail);
    vi.stubGlobal("fetch", fetchMock);
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /Analyze My Result/ }));
    await waitFor(() => expect(screen.getByText(AI_UNAVAILABLE_MESSAGE)).toBeTruthy());

    fetchMock.mockImplementation(ok);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText(validAnalysis().summary)).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows the unavailable message on network errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /Analyze My Result/ }));
    await waitFor(() => expect(screen.getByText(AI_UNAVAILABLE_MESSAGE)).toBeTruthy());
  });

  it("marks the analysis outdated when inputs change, without re-calling the AI automatically", async () => {
    const fetchMock = vi.fn(ok);
    vi.stubGlobal("fetch", fetchMock);
    const view = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /Analyze My Result/ }));
    await waitFor(() => expect(screen.getByText(validAnalysis().summary)).toBeTruthy());

    view.rerender(<AiAnalysisPanel calculator="masters-roi" inputs={{ ...DEFAULT_INPUTS, tuition: 50_000 }} currency="USD" disabled={false} />);
    expect(screen.getByText(/Your inputs changed since this analysis/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Analyze updated result/ })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
