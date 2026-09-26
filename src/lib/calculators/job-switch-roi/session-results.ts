/**
 * Results snapshot stored with a saved Job Switch session: headline metrics for
 * every scenario, computed on the server. The chart timeline is not stored; it
 * can be regenerated from the inputs.
 */

import type { ScenarioId } from "../framework/scenarios";
import { JOB_SWITCH_FORMULA_VERSION } from "./defaults";
import { runJobSwitchScenarios } from "./scenarios";
import type { JobSwitchInputs, JobSwitchResult } from "./types";

export type JobSwitchResultSummary = Omit<JobSwitchResult, "inputs" | "timeline" | "assumptions">;

export interface JobSwitchSessionResults {
  formulaVersion: string;
  scenarios: Record<ScenarioId, JobSwitchResultSummary>;
}

export function buildJobSwitchSessionResults(inputs: JobSwitchInputs): JobSwitchSessionResults {
  const scenarios = {} as Record<ScenarioId, JobSwitchResultSummary>;
  for (const { scenario, result } of runJobSwitchScenarios(inputs)) {
    const { inputs: _i, timeline: _t, assumptions: _a, ...summary } = result;
    scenarios[scenario.id] = summary;
  }
  return { formulaVersion: JOB_SWITCH_FORMULA_VERSION, scenarios };
}
