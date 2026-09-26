"use client";

/**
 * Client container for the Master's ROI calculator.
 *
 * Responsibilities: hold input state, sync it to the URL, call the pure engine,
 * and compose generic presentational components. It performs no math itself
 * beyond choosing what to display.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssumptionList } from "@/components/calculator/AssumptionList";
import { CalculatorLayout } from "@/components/calculator/CalculatorLayout";
import { CumulativeChart, type ChartSeries } from "@/components/calculator/CumulativeChart";
import { InputPanel } from "@/components/calculator/InputPanel";
import { ScenarioTable, type ScenarioRow } from "@/components/calculator/ScenarioTable";
import { StatGrid, type StatItem } from "@/components/calculator/StatGrid";
import { TornadoChart } from "@/components/calculator/TornadoChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/SelectField";
import { DEFAULT_INPUTS } from "@/lib/calculators/masters-roi/defaults";
import { MASTERS_ROI_FIELDS } from "@/lib/calculators/masters-roi/fields";
import { runScenarios, type ScenarioId, type ScenarioOutcome } from "@/lib/calculators/masters-roi/scenarios";
import { analyseSensitivity } from "@/lib/calculators/masters-roi/sensitivity";
import type { MastersRoiInputKey, MastersRoiInputs, MastersRoiResult } from "@/lib/calculators/masters-roi/types";
import { parseUrlState, serializeUrlState } from "@/lib/calculators/masters-roi/url-state";
import { validateMastersRoiInputs } from "@/lib/calculators/masters-roi/validation";
import type { SensitivityAnalysis } from "@/lib/calculators/types";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencySymbol,
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  formatYears,
  formatYearsShort,
  isCurrencyCode,
  type CurrencyCode,
} from "@/lib/format";

const SCENARIO_COLORS: Record<ScenarioId, string> = {
  optimistic: "var(--series-3)",
  expected: "var(--series-1)",
  conservative: "var(--series-2)",
};

interface Computed {
  expected: MastersRoiResult;
  scenarios: ScenarioOutcome[];
  sensitivity: SensitivityAnalysis;
}

function compute(inputs: MastersRoiInputs): Computed {
  const scenarios = runScenarios(inputs);
  const expected = scenarios.find((s) => s.scenario.id === "expected")!.result;
  return { expected, scenarios, sensitivity: analyseSensitivity(inputs) };
}

type Tone = "positive" | "negative" | "neutral";
const tone = (v: number): Tone => (v > 0.5 ? "positive" : v < -0.5 ? "negative" : "neutral");

function breakEvenText(r: MastersRoiResult): string {
  if (!r.breakEven.reached || r.breakEven.yearsAfterGraduation === null) return "Not within 50 yrs";
  if (r.breakEven.yearsAfterGraduation === 0) return "Immediately";
  return formatYearsShort(r.breakEven.yearsAfterGraduation);
}

export function MastersRoiCalculator() {
  const [inputs, setInputs] = useState<MastersRoiInputs>({ ...DEFAULT_INPUTS });
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load shared state from the URL once, after hydration (keeps the page statically renderable).
  useEffect(() => {
    const state = parseUrlState(new URLSearchParams(window.location.search));
    setInputs(state.inputs);
    setCurrency(state.currency);
    setHydrated(true);
  }, []);

  const validation = useMemo(() => validateMastersRoiInputs(inputs), [inputs]);

  // Keep URL in sync (only with valid inputs, so shared links always work).
  useEffect(() => {
    if (!hydrated || !validation.valid) return;
    const qs = serializeUrlState({ inputs, currency });
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", url);
  }, [inputs, currency, hydrated, validation.valid]);

  // Results: recompute on valid inputs; otherwise keep showing the last valid results.
  const lastGood = useRef<Computed | null>(null);
  const computed = useMemo(() => {
    if (validation.valid) lastGood.current = compute(inputs);
    return lastGood.current ?? compute(DEFAULT_INPUTS);
  }, [inputs, validation.valid]);
  const stale = !validation.valid;

  const onChange = useCallback((key: MastersRoiInputKey, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setCurrency(DEFAULT_CURRENCY);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard unavailable (e.g. insecure context): the URL bar already holds the link. */
    }
  };

  const r = computed.expected;
  const sym = currencySymbol(currency);

  // ---- Headline metrics -------------------------------------------------------
  const stats: StatItem[] = [
    {
      id: "education",
      label: "Total education cost",
      value: formatCurrency(r.totalEducationCost, currency),
      detail: `Tuition + ${formatCurrency(r.totalLivingCost, currency)} living − scholarship`,
    },
    {
      id: "opportunity",
      label: "Opportunity cost",
      value: formatCurrency(r.opportunityCost, currency),
      detail: "Salary you give up while studying",
    },
    {
      id: "net",
      label: "Net investment",
      value: formatCurrency(r.netInvestment, currency),
      detail: "Education cost + opportunity cost",
    },
    {
      id: "increase",
      label: "Annual income increase",
      value: formatSignedCurrency(r.annualIncomeIncrease, currency),
      tone: tone(r.annualIncomeIncrease),
      detail: `First year, vs. ${formatCurrency(r.counterfactualSalaryAtStart, currency)} without the degree`,
    },
    {
      id: "breakeven",
      label: "Break-even period",
      value: breakEvenText(r),
      tone: r.breakEven.reached ? "neutral" : "negative",
      detail: "After graduation",
    },
    {
      id: "impact5",
      label: "5-year impact",
      value: formatSignedCurrency(r.impact5Year, currency),
      tone: tone(r.impact5Year),
      detail: "Net position 5 years after graduating",
    },
    {
      id: "impact10",
      label: "10-year impact",
      value: formatSignedCurrency(r.impact10Year, currency),
      tone: tone(r.impact10Year),
      detail: "Net position 10 years after graduating",
    },
    {
      id: "return10",
      label: "10-year ROI",
      value: r.return10Year === null ? "—" : formatPercent(r.return10Year, 0),
      tone: r.return10Year === null ? "neutral" : tone(r.return10Year),
      detail: r.return10Year === null ? "No net investment to return" : "10-year impact ÷ net investment",
    },
  ];

  // ---- Scenarios --------------------------------------------------------------
  const scenarioColumns = computed.scenarios.map((s) => ({
    id: s.scenario.id,
    label: s.scenario.label,
    summary: s.scenario.summary,
    adjustments: s.scenario.adjustments.map((a) => a.description),
    color: SCENARIO_COLORS[s.scenario.id],
    highlighted: s.scenario.id === "expected",
  }));
  const results = computed.scenarios.map((s) => s.result);
  const scenarioRows: ScenarioRow[] = [
    { label: "Total education cost", values: results.map((x) => formatCurrency(x.totalEducationCost, currency)) },
    { label: "Opportunity cost", values: results.map((x) => formatCurrency(x.opportunityCost, currency)) },
    { label: "Net investment", values: results.map((x) => formatCurrency(x.netInvestment, currency)) },
    {
      label: "Annual income increase",
      values: results.map((x) => formatSignedCurrency(x.annualIncomeIncrease, currency)),
      tones: results.map((x) => tone(x.annualIncomeIncrease)),
    },
    { label: "Break-even (after graduation)", values: results.map(breakEvenText) },
    {
      label: "5-year impact",
      values: results.map((x) => formatSignedCurrency(x.impact5Year, currency)),
      tones: results.map((x) => tone(x.impact5Year)),
    },
    {
      label: "10-year impact",
      values: results.map((x) => formatSignedCurrency(x.impact10Year, currency)),
      tones: results.map((x) => tone(x.impact10Year)),
    },
  ];
  const chartSeries: ChartSeries[] = computed.scenarios.map((s) => ({
    id: s.scenario.id,
    label: s.scenario.label,
    color: SCENARIO_COLORS[s.scenario.id],
    points: s.result.timeline,
  }));

  const conservative = computed.scenarios.find((s) => s.scenario.id === "conservative")!.result;

  // ---- Render -------------------------------------------------------------------
  const inputsPanel = (
    <Card as="section" aria-labelledby="inputs-title">
      <CardHeader
        id="inputs-title"
        title="Your numbers"
        description="Results update as you type."
        action={
          <button type="button" onClick={reset} className="rounded-md px-2 py-1 text-xs font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
            Reset
          </button>
        }
      />
      <div className="space-y-5">
        <SelectField
          label="Currency"
          value={currency}
          options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.label}` }))}
          onChange={(v) => isCurrencyCode(v) && setCurrency(v)}
        />
        <InputPanel fields={MASTERS_ROI_FIELDS} values={inputs} errors={validation.errors} onChange={onChange} currencySymbol={sym} />
      </div>
    </Card>
  );

  const resultsPanel = (
    <div className={`space-y-6 transition-opacity ${stale ? "opacity-50" : ""}`} aria-live="polite">
      {stale ? (
        <p role="status" className="rounded-xl bg-negative-soft px-4 py-3 text-sm text-negative">
          Some inputs need fixing. Showing results for your last valid numbers.
        </p>
      ) : null}

      <Card as="section" aria-labelledby="summary-title" className="bg-gradient-to-br from-accent-soft/60 to-surface">
        <h2 id="summary-title" className="text-xs font-semibold tracking-wide text-accent uppercase">
          Expected scenario at a glance
        </h2>
        <p className="mt-2 text-xl leading-snug font-semibold tracking-tight text-ink sm:text-2xl">
          {r.breakEven.reached && r.breakEven.yearsAfterGraduation !== null ? (
            r.breakEven.yearsAfterGraduation === 0 ? (
              <>With your inputs the degree costs you nothing net — it is ahead from graduation day.</>
            ) : (
              <>
                With your inputs the degree pays for itself about{" "}
                <span className="text-accent">{formatYears(r.breakEven.yearsAfterGraduation)}</span> after graduation.
              </>
            )
          ) : (
            <>With your inputs the degree does not pay for itself within 50 years of graduating.</>
          )}
        </p>
        <p className="mt-2 text-sm text-ink-2">
          Ten years after graduating you would be{" "}
          <strong className={r.impact10Year >= 0 ? "text-positive" : "text-negative"}>
            {formatSignedCurrency(r.impact10Year, currency)}
          </strong>{" "}
          compared with not doing the degree. In the conservative scenario:{" "}
          <strong className={conservative.impact10Year >= 0 ? "text-positive" : "text-negative"}>
            {formatSignedCurrency(conservative.impact10Year, currency)}
          </strong>
          .
        </p>
        {validation.warnings.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {validation.warnings.map((w) => (
              <li key={w} className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
                <span aria-hidden="true">⚠ </span>
                {w}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            {copied ? "Link copied" : "Copy link to these results"}
          </button>
          <a href="#how-it-works" className="rounded-lg border border-line-strong px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2">
            How this is calculated
          </a>
        </div>
      </Card>

      <section aria-labelledby="metrics-title">
        <h2 id="metrics-title" className="sr-only">
          Key results
        </h2>
        <StatGrid items={stats} />
      </section>

      <Card as="section" aria-labelledby="timeline-title">
        <CardHeader
          id="timeline-title"
          title="Cumulative financial impact over time"
          description="How far ahead or behind the degree leaves you, from the first day of study to 10 years after graduation."
        />
        <CumulativeChart
          series={chartSeries}
          studyEnd={r.inputs.studyDurationYears}
          currency={currency}
          title="Cumulative financial impact by scenario"
        />
      </Card>

      <Card as="section" aria-labelledby="scenarios-title">
        <CardHeader
          id="scenarios-title"
          title="Scenarios"
          description="The same model run three times: with your inputs, and with each set of adjustments below applied to them."
        />
        <ScenarioTable columns={scenarioColumns} rows={scenarioRows} caption="Results by scenario" />
      </Card>

      <Card as="section" aria-labelledby="sensitivity-title">
        <CardHeader
          id="sensitivity-title"
          title="Which assumptions matter most"
          description={
            <>
              Sensitivity of your 10-year impact. Focus your research on the assumptions at the top — here,{" "}
              <strong className="text-ink">{computed.sensitivity.rows[0]?.label.toLowerCase()}</strong>.
            </>
          }
        />
        <TornadoChart analysis={computed.sensitivity} currency={currency} />
      </Card>

      <Card as="section" aria-labelledby="assumptions-title">
        <CardHeader
          id="assumptions-title"
          title="Assumptions used"
          description="Everything the model assumes, with the values it used for your expected scenario."
        />
        <AssumptionList assumptions={r.assumptions} currency={currency} />
      </Card>
    </div>
  );

  return <CalculatorLayout inputs={inputsPanel} results={resultsPanel} />;
}
