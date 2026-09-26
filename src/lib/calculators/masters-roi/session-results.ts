/**
 * The results snapshot stored with a saved calculator session.
 *
 * Results are always computed on the server from the submitted inputs with the
 * deterministic engine; results sent by a client are never trusted or stored.
 * The snapshot keeps headline metrics for every scenario but not the chart
 * timeline, which can be regenerated from the inputs at any time.
 */

import { MASTERS_ROI_FORMULA_VERSION } from "./defaults";
import { runScenarios, type ScenarioId } from "./scenarios";
import type { BreakEven, MastersRoiInputs, MastersRoiResult } from "./types";

export interface ResultSummary {
  totalEducationCost: number;
  totalLivingCost: number;
  opportunityCost: number;
  netInvestment: number;
  counterfactualSalaryAtStart: number;
  annualIncomeIncrease: number;
  breakEven: BreakEven;
  impact5Year: number;
  impact10Year: number;
  return10Year: number | null;
}

export interface MastersRoiSessionResults {
  formulaVersion: string;
  scenarios: Record<ScenarioId, ResultSummary>;
}

function summarize(r: MastersRoiResult): ResultSummary {
  return {
    totalEducationCost: r.totalEducationCost,
    totalLivingCost: r.totalLivingCost,
    opportunityCost: r.opportunityCost,
    netInvestment: r.netInvestment,
    counterfactualSalaryAtStart: r.counterfactualSalaryAtStart,
    annualIncomeIncrease: r.annualIncomeIncrease,
    breakEven: r.breakEven,
    impact5Year: r.impact5Year,
    impact10Year: r.impact10Year,
    return10Year: r.return10Year,
  };
}

export function buildMastersRoiSessionResults(inputs: MastersRoiInputs): MastersRoiSessionResults {
  const scenarios = {} as Record<ScenarioId, ResultSummary>;
  for (const outcome of runScenarios(inputs)) scenarios[outcome.scenario.id] = summarize(outcome.result);
  return { formulaVersion: MASTERS_ROI_FORMULA_VERSION, scenarios };
}
