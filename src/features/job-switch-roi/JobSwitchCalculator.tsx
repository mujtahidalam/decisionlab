"use client";

/**
 * Client container for the Job Switch ROI calculator — the same framework as
 * every calculator: shared controller for state/URL/saving, pure engine for
 * math, generic presentational components. No math happens here.
 */

import { AiAnalysisPanel } from "@/components/calculator/AiAnalysisPanel";
import { AssumptionList } from "@/components/calculator/AssumptionList";
import { CalculatorLayout } from "@/components/calculator/CalculatorLayout";
import { CumulativeChart, type ChartSeries, type ChartTimeAxis } from "@/components/calculator/CumulativeChart";
import { InputsCard } from "@/components/calculator/InputsCard";
import { SCENARIO_COLORS, toneOf } from "@/components/calculator/presentation";
import { SaveShareBar } from "@/components/calculator/SaveShareBar";
import { ScenarioTable, type ScenarioRow } from "@/components/calculator/ScenarioTable";
import { StatGrid, type StatItem } from "@/components/calculator/StatGrid";
import { TornadoChart } from "@/components/calculator/TornadoChart";
import { WarningList } from "@/components/calculator/WarningList";
import { Card, CardHeader } from "@/components/ui/Card";
import { useCalculatorController } from "@/features/shared/useCalculatorController";
import { JOB_SWITCH_DEFAULT_INPUTS, JOB_SWITCH_MODEL_CONSTANTS } from "@/lib/calculators/job-switch-roi/defaults";
import { JOB_SWITCH_FIELDS } from "@/lib/calculators/job-switch-roi/fields";
import { parseJobSwitchInputs } from "@/lib/calculators/job-switch-roi/input-parsing";
import { runJobSwitchScenarios, type JobSwitchScenarioOutcome } from "@/lib/calculators/job-switch-roi/scenarios";
import { analyseJobSwitchSensitivity } from "@/lib/calculators/job-switch-roi/sensitivity";
import type { JobSwitchInputKey, JobSwitchInputs, JobSwitchResult } from "@/lib/calculators/job-switch-roi/types";
import { jobSwitchUrlCodec } from "@/lib/calculators/job-switch-roi/url-state";
import { validateJobSwitchInputs } from "@/lib/calculators/job-switch-roi/validation";
import type { SensitivityAnalysis } from "@/lib/calculators/types";
import { formatCurrency, formatPercent, formatSignedCurrency, formatYears, formatYearsShort } from "@/lib/format";

interface Computed {
  expected: JobSwitchResult;
  scenarios: JobSwitchScenarioOutcome[];
  sensitivity: SensitivityAnalysis;
}

function compute(inputs: JobSwitchInputs): Computed {
  const scenarios = runJobSwitchScenarios(inputs);
  const expected = scenarios.find((s) => s.scenario.id === "expected")!.result;
  return { expected, scenarios, sensitivity: analyseJobSwitchSensitivity(inputs) };
}

const HORIZON = JOB_SWITCH_MODEL_CONSTANTS.breakEvenHorizonYears;

function breakEvenText(r: JobSwitchResult): string {
  if (!r.breakEven.reached || r.breakEven.years === null) return `Not within ${HORIZON} yrs`;
  if (r.breakEven.years === 0) return "Immediately";
  return formatYearsShort(r.breakEven.years);
}

function timeAxis(gapYears: number): ChartTimeAxis {
  const years = JOB_SWITCH_MODEL_CONSTANTS.timelineYears;
  return {
    phase: gapYears > 0 ? { end: gapYears, label: "Between jobs" } : undefined,
    marker: gapYears > 0 ? { t: gapYears, label: "New job starts" } : undefined,
    tickLabel: (t) => (t === 0 ? "Today" : `Yr ${t}`),
    describeTime: (t) => (t === 0 ? "Today" : `${formatYears(t)} from today`),
    table: {
      header: "From today",
      times: Array.from({ length: years + 1 }, (_, k) => k),
      label: (t) => (t === 0 ? "Today (one-time items)" : formatYears(t)),
    },
    caption:
      "Cumulative cash from switching minus staying. It starts at minus your one-time costs (or plus, if a signing bonus covers them). Where a line crosses zero for good, switching has paid off.",
  };
}

export function JobSwitchCalculator() {
  const c = useCalculatorController<JobSwitchInputKey, JobSwitchInputs, Computed>({
    slug: "job-switch-roi",
    defaults: JOB_SWITCH_DEFAULT_INPUTS,
    codec: jobSwitchUrlCodec,
    validate: validateJobSwitchInputs,
    parseInputs: parseJobSwitchInputs,
    compute,
  });
  const { computed, currency, stale, session } = c;
  const r = computed.expected;
  const conservative = computed.scenarios.find((s) => s.scenario.id === "conservative")!.result;

  const stats: StatItem[] = [
    {
      id: "cost",
      label: "Net switching cost",
      value: formatCurrency(r.netSwitchingCost, currency),
      tone: r.netSwitchingCost < -0.5 ? "positive" : "neutral",
      detail:
        r.netSwitchingCost < -0.5
          ? "Negative: your signing bonus more than covers the cost of switching"
          : `${formatCurrency(r.oneTimeNetCost, currency)} one-time + ${formatCurrency(r.incomeLostDuringGap, currency)} pay lost in the gap`,
    },
    {
      id: "increase",
      label: "Annual pay increase",
      value: formatSignedCurrency(r.annualPackageIncrease, currency),
      tone: toneOf(r.annualPackageIncrease),
      detail: `${formatCurrency(r.newPackage, currency)} vs. ${formatCurrency(r.counterfactualPackageAtStart, currency)} if you stay`,
    },
    {
      id: "gain",
      label: "Net annual gain",
      value: formatSignedCurrency(r.netAnnualGain, currency),
      tone: toneOf(r.netAnnualGain),
      detail: "First year, after the new job's extra costs",
    },
    {
      id: "breakeven",
      label: "Break-even",
      value: breakEvenText(r),
      tone: r.breakEven.reached ? "neutral" : "negative",
      detail: "From today, staying ahead for good",
    },
    { id: "impact1", label: "1-year impact", value: formatSignedCurrency(r.impact1Year, currency), tone: toneOf(r.impact1Year), detail: "Switch vs. stay, 1 year from today" },
    { id: "impact3", label: "3-year impact", value: formatSignedCurrency(r.impact3Year, currency), tone: toneOf(r.impact3Year), detail: "Switch vs. stay, 3 years from today" },
    { id: "impact5", label: "5-year impact", value: formatSignedCurrency(r.impact5Year, currency), tone: toneOf(r.impact5Year), detail: "Switch vs. stay, 5 years from today" },
    {
      id: "roi5",
      label: "5-year ROI",
      value: r.return5Year === null ? "—" : formatPercent(r.return5Year, 0),
      tone: r.return5Year === null ? "neutral" : toneOf(r.return5Year),
      detail: r.return5Year === null ? "No net switching cost to return" : "5-year impact ÷ net switching cost",
    },
  ];

  const scenarioColumns = computed.scenarios.map((s) => ({
    id: s.scenario.id,
    label: s.scenario.label,
    summary: s.scenario.summary,
    adjustments: s.scenario.adjustments.map((a) => a.description),
    color: SCENARIO_COLORS[s.scenario.id],
    highlighted: s.scenario.id === "expected",
  }));
  const results = computed.scenarios.map((s) => s.result);
  const signedRow = (label: string, pick: (x: JobSwitchResult) => number): ScenarioRow => ({
    label,
    values: results.map((x) => formatSignedCurrency(pick(x), currency)),
    tones: results.map((x) => toneOf(pick(x))),
  });
  const scenarioRows: ScenarioRow[] = [
    { label: "Net switching cost", values: results.map((x) => formatCurrency(x.netSwitchingCost, currency)) },
    signedRow("Net annual gain", (x) => x.netAnnualGain),
    { label: "Break-even (from today)", values: results.map(breakEvenText) },
    signedRow("1-year impact", (x) => x.impact1Year),
    signedRow("3-year impact", (x) => x.impact3Year),
    signedRow("5-year impact", (x) => x.impact5Year),
  ];
  const chartSeries: ChartSeries[] = computed.scenarios.map((s) => ({
    id: s.scenario.id,
    label: s.scenario.label,
    color: SCENARIO_COLORS[s.scenario.id],
    points: s.result.timeline,
  }));

  const headline =
    r.breakEven.reached && r.breakEven.years !== null ? (
      r.breakEven.years === 0 ? (
        <>With your inputs, switching puts you ahead from day one and keeps you ahead.</>
      ) : (
        <>
          With your inputs, switching pays for itself about <span className="text-accent">{formatYears(r.breakEven.years)}</span> from
          today.
        </>
      )
    ) : (
      <>With your inputs, switching doesn&apos;t pay off financially within {HORIZON} years.</>
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
        <p className="mt-2 text-xl leading-snug font-semibold tracking-tight text-ink sm:text-2xl">{headline}</p>
        <p className="mt-2 text-sm text-ink-2">
          Five years from now you would be{" "}
          <strong className={r.impact5Year >= 0 ? "text-positive" : "text-negative"}>{formatSignedCurrency(r.impact5Year, currency)}</strong>{" "}
          compared with staying. In the conservative scenario:{" "}
          <strong className={conservative.impact5Year >= 0 ? "text-positive" : "text-negative"}>
            {formatSignedCurrency(conservative.impact5Year, currency)}
          </strong>
          .
        </p>
        <WarningList warnings={c.validation.warnings} />
        <SaveShareBar
          disabled={stale}
          isSaved={session.isCurrent}
          savedAt={session.active?.createdAt ?? null}
          saveState={session.saveState}
          loadError={session.loadError}
          copied={session.copied}
          onSave={session.save}
          onCopy={session.copyLink}
        />
      </Card>

      <section aria-labelledby="metrics-title">
        <h2 id="metrics-title" className="sr-only">
          Key results
        </h2>
        <StatGrid items={stats} />
      </section>

      <AiAnalysisPanel calculator="job-switch-roi" inputs={c.inputs} currency={currency} disabled={stale} />

      <Card as="section" aria-labelledby="timeline-title">
        <CardHeader
          id="timeline-title"
          title="Cumulative financial impact over time"
          description="How far ahead or behind switching leaves you compared with staying, over the next five years."
        />
        <CumulativeChart series={chartSeries} axis={timeAxis(r.inputs.gapMonths / 12)} currency={currency} title="Cumulative impact of switching by scenario" />
      </Card>

      <Card as="section" aria-labelledby="scenarios-title">
        <CardHeader
          id="scenarios-title"
          title="Scenarios"
          description="Your current job is a known quantity, so the scenarios vary what's uncertain about the new one."
        />
        <ScenarioTable columns={scenarioColumns} rows={scenarioRows} caption="Results by scenario" />
      </Card>

      <Card as="section" aria-labelledby="sensitivity-title">
        <CardHeader
          id="sensitivity-title"
          title="Which assumptions matter most"
          description={
            <>
              Sensitivity of your 5-year impact. Before deciding, pin down the assumptions at the top — here,{" "}
              <strong className="text-ink">{computed.sensitivity.rows[0]?.label.toLowerCase()}</strong>.
            </>
          }
        />
        <TornadoChart analysis={computed.sensitivity} currency={currency} />
      </Card>

      <Card as="section" aria-labelledby="assumptions-title">
        <CardHeader id="assumptions-title" title="Assumptions used" description="Everything the model assumes, with the values it used for your expected scenario." />
        <AssumptionList assumptions={r.assumptions} currency={currency} />
      </Card>
    </div>
  );

  return (
    <CalculatorLayout
      inputs={
        <InputsCard
          fields={JOB_SWITCH_FIELDS}
          values={c.inputs}
          errors={c.validation.errors}
          onChange={c.setInput}
          currency={currency}
          onCurrencyChange={c.setCurrency}
          onReset={c.reset}
        />
      }
      results={resultsPanel}
    />
  );
}
