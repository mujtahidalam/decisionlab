/** Builds the AI analysis context for the Job Switch calculator from the deterministic engine. */

import type { AnalysisContext, LabelledValue } from "../../ai/types";
import { formatCurrency, formatPercent, formatSignedCurrency, formatYears, type CurrencyCode } from "../../format";
import { describeAssumptions, describeInputs, describeSensitivity } from "../framework/analysis-context";
import { JOB_SWITCH_FORMULA_VERSION } from "./defaults";
import { JOB_SWITCH_FIELDS } from "./fields";
import { runJobSwitchScenarios } from "./scenarios";
import { analyseJobSwitchSensitivity } from "./sensitivity";
import type { JobSwitchInputs, JobSwitchResult } from "./types";
import { validateJobSwitchInputs } from "./validation";

function breakEvenText(r: JobSwitchResult): string {
  const be = r.breakEven;
  if (!be.reached || be.years === null) return `Not reached within ${be.horizonYears} years`;
  if (be.years === 0) return "Immediately (switching is never behind)";
  return `${formatYears(be.years)} from today`;
}

function headlineResults(r: JobSwitchResult, currency: CurrencyCode): LabelledValue[] {
  return [
    { name: "Net switching cost", value: formatCurrency(r.netSwitchingCost, currency) },
    { name: "Net annual gain (first year, after extra costs)", value: formatSignedCurrency(r.netAnnualGain, currency) },
    { name: "Break-even (switching stays ahead for good)", value: breakEvenText(r) },
    { name: "1-year impact", value: formatSignedCurrency(r.impact1Year, currency) },
    { name: "3-year impact", value: formatSignedCurrency(r.impact3Year, currency) },
    { name: "5-year impact", value: formatSignedCurrency(r.impact5Year, currency) },
  ];
}

export function buildJobSwitchAnalysisContext(inputs: JobSwitchInputs, currency: CurrencyCode): AnalysisContext {
  const outcomes = runJobSwitchScenarios(inputs);
  const r = outcomes.find((o) => o.scenario.id === "expected")!.result;
  return {
    calculatorType: "job-switch-roi",
    calculatorName: "Job Switch ROI Calculator",
    formulaVersion: JOB_SWITCH_FORMULA_VERSION,
    currency,
    inputs: describeInputs(JOB_SWITCH_FIELDS, inputs, currency),
    results: [
      { name: "Current package (salary + bonus + benefits)", value: formatCurrency(r.currentPackage, currency) },
      { name: "New package (salary + bonus + benefits)", value: formatCurrency(r.newPackage, currency) },
      { name: "Current package when the new job starts", value: formatCurrency(r.counterfactualPackageAtStart, currency) },
      { name: "Annual pay increase (first year)", value: formatSignedCurrency(r.annualPackageIncrease, currency) },
      { name: "One-time net cost", value: formatCurrency(r.oneTimeNetCost, currency) },
      { name: "Pay lost during the gap", value: formatCurrency(r.incomeLostDuringGap, currency) },
      ...headlineResults(r, currency),
      { name: "5-year ROI", value: r.return5Year === null ? "Not applicable (no net switching cost)" : formatPercent(r.return5Year, 0) },
    ],
    scenarios: outcomes.map((o) => ({
      name: o.scenario.label,
      changes: o.scenario.adjustments.map((a) => a.description),
      results: headlineResults(o.result, currency),
    })),
    sensitivity: describeSensitivity(analyseJobSwitchSensitivity(inputs), currency),
    assumptions: describeAssumptions(r.assumptions, currency),
    warnings: validateJobSwitchInputs(inputs).warnings,
  };
}
