"use client";

/**
 * Client container for the Master's ROI calculator.
 *
 * State, URL sharing and saving come from the shared calculator controller;
 * this file only maps engine results onto generic presentational components.
 * It performs no math itself.
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
import { DEFAULT_INPUTS } from "@/lib/calculators/masters-roi/defaults";
import { MASTERS_ROI_FIELDS } from "@/lib/calculators/masters-roi/fields";
import { parseMastersRoiInputs } from "@/lib/calculators/masters-roi/input-parsing";
import { runScenarios, type ScenarioOutcome } from "@/lib/calculators/masters-roi/scenarios";
import { analyseSensitivity } from "@/lib/calculators/masters-roi/sensitivity";
import type { MastersRoiInputKey, MastersRoiInputs, MastersRoiResult } from "@/lib/calculators/masters-roi/types";
import { mastersRoiUrlCodec } from "@/lib/calculators/masters-roi/url-state";
import { validateMastersRoiInputs } from "@/lib/calculators/masters-roi/validation";
import type { SensitivityAnalysis } from "@/lib/calculators/types";
import { formatCurrency, formatPercent, formatSignedCurrency, formatYears, formatYearsShort } from "@/lib/format";

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

function breakEvenText(r: MastersRoiResult): string {
  if (!r.breakEven.reached || r.breakEven.yearsAfterGraduation === null) return "Not within 50 yrs";
  if (r.breakEven.yearsAfterGraduation === 0) return "Immediately";
  return formatYearsShort(r.breakEven.yearsAfterGraduation);
}

function timeAxis(studyEnd: number, horizonEnd: number): ChartTimeAxis {
  return {
    phase: { end: studyEnd, label: "Studying" },
    marker: { t: studyEnd, label: "Graduation" },
    tickLabel: (t) => (t === 0 ? "Start" : `Yr ${t}`),
    describeTime: (t) => (t <= studyEnd ? `${formatYears(t)} into the program` : `${formatYears(t - studyEnd)} after graduation`),
    table: {
      header: "After graduation",
      times: Array.from({ length: Math.floor(horizonEnd - studyEnd) + 1 }, (_, k) => studyEnd + k),
      label: (t) => (t === studyEnd ? "Graduation" : formatYears(t - studyEnd)),
    },
    caption:
      "Cumulative cash of the degree path minus the no-degree path. Below zero the degree is still paying itself back; where a line crosses zero it has broken even.",
  };
}

export function MastersRoiCalculator() {
  const c = useCalculatorController<MastersRoiInputKey, MastersRoiInputs, Computed>({
    slug: "masters-roi",
    defaults: DEFAULT_INPUTS,
    codec: mastersRoiUrlCodec,
    validate: validateMastersRoiInputs,
    parseInputs: parseMastersRoiInputs,
    compute,
  });
  const { computed, currency, stale, session } = c;
  const r = computed.expected;

  const stats: StatItem[] = [
    {
      id: "education",
      label: "Total education cost",
      value: formatCurrency(r.totalEducationCost, currency),
      detail: `Tuition + ${formatCurrency(r.totalLivingCost, currency)} living − scholarship`,
    },
    { id: "opportunity", label: "Opportunity cost", value: formatCurrency(r.opportunityCost, currency), detail: "Salary you give up while studying" },
    { id: "net", label: "Net investment", value: formatCurrency(r.netInvestment, currency), detail: "Education cost + opportunity cost" },
    {
      id: "increase",
      label: "Annual income increase",
      value: formatSignedCurrency(r.annualIncomeIncrease, currency),
      tone: toneOf(r.annualIncomeIncrease),
      detail: `First year, vs. ${formatCurrency(r.counterfactualSalaryAtStart, currency)} without the degree`,
    },
    { id: "breakeven", label: "Break-even period", value: breakEvenText(r), tone: r.breakEven.reached ? "neutral" : "negative", detail: "After graduation" },
    { id: "impact5", label: "5-year impact", value: formatSignedCurrency(r.impact5Year, currency), tone: toneOf(r.impact5Year), detail: "Net position 5 years after graduating" },
    { id: "impact10", label: "10-year impact", value: formatSignedCurrency(r.impact10Year, currency), tone: toneOf(r.impact10Year), detail: "Net position 10 years after graduating" },
    {
      id: "return10",
      label: "10-year ROI",
      value: r.return10Year === null ? "—" : formatPercent(r.return10Year, 0),
      tone: r.return10Year === null ? "neutral" : toneOf(r.return10Year),
      detail: r.return10Year === null ? "No net investment to return" : "10-year impact ÷ net investment",
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
  const scenarioRows: ScenarioRow[] = [
    { label: "Total education cost", values: results.map((x) => formatCurrency(x.totalEducationCost, currency)) },
    { label: "Opportunity cost", values: results.map((x) => formatCurrency(x.opportunityCost, currency)) },
    { label: "Net investment", values: results.map((x) => formatCurrency(x.netInvestment, currency)) },
    { label: "Annual income increase", values: results.map((x) => formatSignedCurrency(x.annualIncomeIncrease, currency)), tones: results.map((x) => toneOf(x.annualIncomeIncrease)) },
    { label: "Break-even (after graduation)", values: results.map(breakEvenText) },
    { label: "5-year impact", values: results.map((x) => formatSignedCurrency(x.impact5Year, currency)), tones: results.map((x) => toneOf(x.impact5Year)) },
    { label: "10-year impact", values: results.map((x) => formatSignedCurrency(x.impact10Year, currency)), tones: results.map((x) => toneOf(x.impact10Year)) },
  ];
  const chartSeries: ChartSeries[] = computed.scenarios.map((s) => ({
    id: s.scenario.id,
    label: s.scenario.label,
    color: SCENARIO_COLORS[s.scenario.id],
    points: s.result.timeline,
  }));
  const conservative = computed.scenarios.find((s) => s.scenario.id === "conservative")!.result;
  const studyEnd = r.inputs.studyDurationYears;

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
          <strong className={r.impact10Year >= 0 ? "text-positive" : "text-negative"}>{formatSignedCurrency(r.impact10Year, currency)}</strong>{" "}
          compared with not doing the degree. In the conservative scenario:{" "}
          <strong className={conservative.impact10Year >= 0 ? "text-positive" : "text-negative"}>
            {formatSignedCurrency(conservative.impact10Year, currency)}
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

      <AiAnalysisPanel calculator="masters-roi" inputs={c.inputs} currency={currency} disabled={stale} />

      <Card as="section" aria-labelledby="timeline-title">
        <CardHeader
          id="timeline-title"
          title="Cumulative financial impact over time"
          description="How far ahead or behind the degree leaves you, from the first day of study to 10 years after graduation."
        />
        <CumulativeChart series={chartSeries} axis={timeAxis(studyEnd, studyEnd + 10)} currency={currency} title="Cumulative financial impact by scenario" />
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
        <CardHeader id="assumptions-title" title="Assumptions used" description="Everything the model assumes, with the values it used for your expected scenario." />
        <AssumptionList assumptions={r.assumptions} currency={currency} />
      </Card>
    </div>
  );

  return (
    <CalculatorLayout
      inputs={
        <InputsCard
          fields={MASTERS_ROI_FIELDS}
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
