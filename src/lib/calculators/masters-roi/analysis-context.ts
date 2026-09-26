/**
 * Builds the AI analysis context for the Master's ROI calculator from the
 * deterministic engine. The AI receives these values as-is and only explains them.
 */

import type { AnalysisContext, LabelledValue } from "../../ai/types";
import { formatCurrency, formatPercent, formatSignedCurrency, formatYears, type CurrencyCode } from "../../format";
import { describeAssumptions, describeInputs, describeSensitivity } from "../framework/analysis-context";
import { MASTERS_ROI_FORMULA_VERSION } from "./defaults";
import { MASTERS_ROI_FIELDS } from "./fields";
import { runScenarios } from "./scenarios";
import { analyseSensitivity } from "./sensitivity";
import type { MastersRoiInputs, MastersRoiResult } from "./types";
import { validateMastersRoiInputs } from "./validation";

function breakEvenText(r: MastersRoiResult): string {
  const be = r.breakEven;
  if (!be.reached || be.yearsAfterGraduation === null) return `Not reached within ${be.horizonYears} years of graduating`;
  if (be.yearsAfterGraduation === 0) return "Immediately at graduation (no net investment to recover)";
  return `${formatYears(be.yearsAfterGraduation)} after graduation`;
}

function headlineResults(r: MastersRoiResult, currency: CurrencyCode): LabelledValue[] {
  return [
    { name: "Net investment", value: formatCurrency(r.netInvestment, currency) },
    { name: "Annual income increase (first year)", value: formatSignedCurrency(r.annualIncomeIncrease, currency) },
    { name: "Break-even period", value: breakEvenText(r) },
    { name: "5-year impact after graduation", value: formatSignedCurrency(r.impact5Year, currency) },
    { name: "10-year impact after graduation", value: formatSignedCurrency(r.impact10Year, currency) },
  ];
}

export function buildMastersRoiAnalysisContext(inputs: MastersRoiInputs, currency: CurrencyCode): AnalysisContext {
  const outcomes = runScenarios(inputs);
  const r = outcomes.find((o) => o.scenario.id === "expected")!.result;

  return {
    calculatorType: "masters-roi",
    calculatorName: "Master's Degree ROI Calculator",
    formulaVersion: MASTERS_ROI_FORMULA_VERSION,
    currency,
    inputs: describeInputs(MASTERS_ROI_FIELDS, inputs, currency),
    results: [
      { name: "Total education cost", value: formatCurrency(r.totalEducationCost, currency) },
      { name: "Total living cost during study", value: formatCurrency(r.totalLivingCost, currency) },
      { name: "Opportunity cost (salary given up)", value: formatCurrency(r.opportunityCost, currency) },
      { name: "Salary without the degree when the new job starts", value: formatCurrency(r.counterfactualSalaryAtStart, currency) },
      ...headlineResults(r, currency),
      { name: "10-year ROI", value: r.return10Year === null ? "Not applicable (no net investment)" : formatPercent(r.return10Year, 0) },
    ],
    scenarios: outcomes.map((o) => ({
      name: o.scenario.label,
      changes: o.scenario.adjustments.map((a) => a.description),
      results: headlineResults(o.result, currency),
    })),
    sensitivity: describeSensitivity(analyseSensitivity(inputs), currency),
    assumptions: describeAssumptions(r.assumptions, currency),
    warnings: validateMastersRoiInputs(inputs).warnings,
  };
}
