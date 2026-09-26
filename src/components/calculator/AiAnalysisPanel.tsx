"use client";

/**
 * "AI Decision Analysis" — an on-demand interpretation of a calculator result.
 *
 * Only calls the API when the user clicks "Analyze My Result" (never on input
 * changes), never with invalid inputs, and sends inputs only: the server
 * recomputes every number with the deterministic engine before the AI sees it.
 * Failures never affect the calculator above.
 */

import { useEffect, useRef, useState } from "react";
import type { DecisionAnalysis } from "@/lib/ai/types";
import { requestAnalysis } from "@/lib/api-client/analyze";

export const AI_UNAVAILABLE_MESSAGE = "AI analysis is temporarily unavailable. Your calculated results are still available.";
export const AI_DISCLAIMER =
  "AI-generated analysis is based on the assumptions and calculations provided. It does not guarantee future outcomes and should not be considered financial advice.";

type State =
  | { status: "idle" }
  | { status: "loading"; key: string }
  | { status: "success"; key: string; analysis: DecisionAnalysis }
  | { status: "error"; key: string };

export interface AiAnalysisPanelProps {
  calculator: string;
  /** The calculator's current inputs (model units). Numbers only; no free text is ever sent. */
  inputs: object;
  currency: string;
  /** True while the calculator has invalid inputs. */
  disabled: boolean;
}

const SECTIONS: { key: Exclude<keyof DecisionAnalysis, "summary">; title: string }[] = [
  { key: "key_drivers", title: "Key drivers" },
  { key: "risks", title: "What could change the result?" },
  { key: "sensitivity", title: "Sensitivity" },
  { key: "assumptions", title: "Assumptions" },
  { key: "questions_to_consider", title: "Questions worth considering" },
];

function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M10 2l1.6 4.4L16 8l-4.4 1.6L10 14l-1.6-4.4L4 8l4.4-1.6L10 2zm5 10l.8 2.2L18 15l-2.2.8L15 18l-.8-2.2L12 15l2.2-.8L15 12z" fill="currentColor" />
    </svg>
  );
}

export function AiAnalysisPanel({ calculator, inputs, currency, disabled }: AiAnalysisPanelProps) {
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const key = JSON.stringify({ calculator, inputs, currency });
  const outdated = state.status === "success" && state.key !== key;

  useEffect(() => () => abortRef.current?.abort(), []);

  const analyze = async () => {
    if (disabled || state.status === "loading") return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "loading", key });
    const result = await requestAnalysis({ calculator, inputs: inputs as Record<string, number>, currency }, controller.signal);
    if (controller.signal.aborted) return;
    setState(result.ok ? { status: "success", key, analysis: result.data } : { status: "error", key });
  };

  const buttonLabel =
    state.status === "loading" ? "Analyzing…" : outdated ? "Analyze updated result" : state.status === "success" ? "Analysis up to date" : "Analyze My Result";
  const buttonDisabled = disabled || state.status === "loading" || (state.status === "success" && !outdated);

  return (
    <section aria-labelledby="ai-analysis-title" className="rounded-2xl border border-ai-line bg-ai-soft/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ai ring-1 ring-ai-line">
            <SparkIcon className="h-3.5 w-3.5" />
            Interpretation, not calculation
          </p>
          <h2 id="ai-analysis-title" className="mt-2 text-lg font-semibold tracking-tight text-ink">
            AI Decision Analysis
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-2">
            The results above are exact math from the calculator. This section asks an AI to explain what those numbers
            mean — it cannot change them.
          </p>
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={buttonDisabled}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-ai px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#140f26]"
        >
          <SparkIcon className="h-4 w-4" />
          {buttonLabel}
        </button>
      </div>

      {disabled ? <p className="mt-3 text-xs text-ink-3">Fix the highlighted inputs to analyze your result.</p> : null}
      {state.status === "idle" && !disabled ? (
        <p className="mt-3 text-xs text-ink-3">
          Sends your inputs to our AI provider; the server recalculates every number first. Nothing is stored.
        </p>
      ) : null}

      <div aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "loading" ? (
          <div className="mt-5 rounded-xl border border-ai-line bg-surface p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-ai">
              <SparkIcon className="dl-skeleton h-4 w-4" />
              Analyzing your results...
            </p>
            <div className="mt-4 space-y-2.5" aria-hidden="true">
              {[92, 84, 88, 60].map((w) => (
                <div key={w} className="dl-skeleton h-3 rounded-full bg-ai-soft" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-sm text-ink-2">{AI_UNAVAILABLE_MESSAGE}</p>
            <button type="button" onClick={analyze} disabled={disabled} className="text-sm font-medium text-ai hover:underline disabled:opacity-50">
              Try again
            </button>
          </div>
        ) : null}

        {state.status === "success" ? (
          <div className={`mt-5 space-y-4 transition-opacity ${outdated ? "opacity-60" : ""}`}>
            {outdated ? (
              <p className="rounded-lg bg-surface px-3 py-2 text-xs text-ink-2 ring-1 ring-ai-line">
                Your inputs changed since this analysis. Click “Analyze updated result” to refresh it.
              </p>
            ) : null}
            <div className="rounded-xl border border-ai-line bg-surface p-5">
              <h3 className="text-xs font-semibold tracking-wide text-ai uppercase">What the numbers suggest</h3>
              <p className="mt-2 leading-relaxed text-ink">{state.analysis.summary}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink">Key drivers</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {state.analysis.key_drivers.map((item) => (
                  <li key={item} className="rounded-xl border border-ai-line bg-surface p-3 text-sm leading-relaxed text-ink-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {SECTIONS.slice(1).map((section) => (
                <div key={section.key} className="rounded-xl border border-line bg-surface p-4">
                  <h3 className="text-sm font-semibold text-ink">{section.title}</h3>
                  <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-2">
                    {state.analysis[section.key].map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ai" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-3">{AI_DISCLAIMER}</p>
    </section>
  );
}
