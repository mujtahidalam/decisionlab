/** Shareable URL state for the Master's ROI calculator (shared codec). */

import type { CurrencyCode } from "../../format";
import { createUrlCodec } from "../framework/url-state";
import { DEFAULT_INPUTS } from "./defaults";
import { MASTERS_ROI_FIELDS } from "./fields";
import type { MastersRoiInputKey, MastersRoiInputs } from "./types";

export { CURRENCY_PARAM } from "../framework/url-state";

export const URL_PARAM_KEYS: Readonly<Record<MastersRoiInputKey, string>> = Object.freeze({
  currentSalary: "cs",
  postDegreeSalary: "ps",
  tuition: "tu",
  livingExpenses: "le",
  scholarship: "sc",
  studyDurationYears: "d",
  salaryGrowthRate: "g",
  jobSearchMonths: "js",
});

export interface MastersRoiUrlState {
  inputs: MastersRoiInputs;
  currency: CurrencyCode;
}

export const mastersRoiUrlCodec = createUrlCodec<MastersRoiInputKey, MastersRoiInputs>({
  fields: MASTERS_ROI_FIELDS,
  defaults: DEFAULT_INPUTS,
  paramKeys: URL_PARAM_KEYS,
});

export const parseUrlState = mastersRoiUrlCodec.parse;
export const serializeUrlState = mastersRoiUrlCodec.serialize;
