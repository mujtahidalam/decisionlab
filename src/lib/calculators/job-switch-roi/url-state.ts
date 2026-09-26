/** Shareable URL state for the Job Switch calculator. */

import { createUrlCodec } from "../framework/url-state";
import { JOB_SWITCH_DEFAULT_INPUTS } from "./defaults";
import { JOB_SWITCH_FIELDS } from "./fields";
import type { JobSwitchInputKey, JobSwitchInputs } from "./types";

export const JOB_SWITCH_URL_PARAM_KEYS: Readonly<Record<JobSwitchInputKey, string>> = Object.freeze({
  currentSalary: "cs",
  currentBonus: "cb",
  currentBenefits: "cf",
  currentGrowthRate: "cg",
  newSalary: "ns",
  newBonus: "nb",
  newBenefits: "nf",
  newGrowthRate: "ng",
  signingBonus: "sb",
  forfeitedCompensation: "fc",
  relocationCost: "rc",
  gapMonths: "gap",
  annualCostChange: "xc",
});

export const jobSwitchUrlCodec = createUrlCodec<JobSwitchInputKey, JobSwitchInputs>({
  fields: JOB_SWITCH_FIELDS,
  defaults: JOB_SWITCH_DEFAULT_INPUTS,
  paramKeys: JOB_SWITCH_URL_PARAM_KEYS,
});
