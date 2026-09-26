/** Strict parser for untrusted Job Switch inputs (API request bodies). */

import { createInputParser } from "../framework/input-parsing";
import { JOB_SWITCH_FIELDS } from "./fields";
import type { JobSwitchInputKey, JobSwitchInputs } from "./types";
import { validateJobSwitchInputs } from "./validation";

export const parseJobSwitchInputs = createInputParser<JobSwitchInputKey, JobSwitchInputs>({
  fields: JOB_SWITCH_FIELDS,
  validate: validateJobSwitchInputs,
});
