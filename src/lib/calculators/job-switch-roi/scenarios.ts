/**
 * Job Switch scenarios. The current job is a known quantity, so the scenarios
 * vary what's uncertain about the new one: bonus payout, raises, start date, moving costs.
 */

import { runScenarioSet, type ScenarioDefinition, type ScenarioOutcome } from "../framework/scenarios";
import { calculateJobSwitch } from "./engine";
import { JOB_SWITCH_FIELDS } from "./fields";
import type { JobSwitchInputKey, JobSwitchInputs, JobSwitchResult } from "./types";

export const JOB_SWITCH_SCENARIOS: readonly ScenarioDefinition<JobSwitchInputKey>[] = [
  {
    id: "optimistic",
    label: "Optimistic",
    summary: "The new job pays its bonus above target, raises are faster and you start sooner.",
    adjustments: [
      { key: "newBonus", kind: "multiply", amount: 0.25, description: "New bonus +25%" },
      { key: "newGrowthRate", kind: "add", amount: 0.01, description: "New-job raises +1 percentage point" },
      { key: "gapMonths", kind: "add", amount: -1, description: "Start 1 month sooner" },
    ],
  },
  {
    id: "expected",
    label: "Expected",
    summary: "Exactly the values you entered.",
    adjustments: [],
  },
  {
    id: "conservative",
    label: "Conservative",
    summary: "The bonus pays at half target, raises are slower, the start slips and moving costs overrun.",
    adjustments: [
      { key: "newBonus", kind: "multiply", amount: -0.5, description: "New bonus −50%" },
      { key: "newGrowthRate", kind: "add", amount: -0.01, description: "New-job raises −1 percentage point" },
      { key: "gapMonths", kind: "add", amount: 2, description: "Start 2 months later" },
      { key: "relocationCost", kind: "multiply", amount: 0.25, description: "Moving costs +25%" },
    ],
  },
] as const;

export type JobSwitchScenarioOutcome = ScenarioOutcome<JobSwitchInputKey, JobSwitchInputs, JobSwitchResult>;

export function runJobSwitchScenarios(inputs: JobSwitchInputs): JobSwitchScenarioOutcome[] {
  return runScenarioSet(JOB_SWITCH_FIELDS, JOB_SWITCH_SCENARIOS, inputs, calculateJobSwitch);
}
