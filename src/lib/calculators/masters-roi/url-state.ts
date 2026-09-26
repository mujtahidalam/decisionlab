/**
 * Shareable URL state: inputs <-> query string.
 *
 * Short, stable parameter names keep links readable. Parsing is defensive:
 * unknown, missing or out-of-range values fall back to defaults, so a
 * hand-edited or stale URL can never break the page.
 */

import { isCurrencyCode, type CurrencyCode, DEFAULT_CURRENCY } from "../../format";
import { toDisplayValue } from "../field-units";
import { DEFAULT_INPUTS } from "./defaults";
import { getField } from "./fields";
import type { MastersRoiInputKey, MastersRoiInputs } from "./types";

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

export const CURRENCY_PARAM = "cur";

export interface MastersRoiUrlState {
  inputs: MastersRoiInputs;
  currency: CurrencyCode;
}

type ParamSource = { get(name: string): string | null };

/** Parses URLSearchParams (or Next's searchParams wrapper) into a full, valid state. */
export function parseUrlState(params: ParamSource): MastersRoiUrlState {
  const inputs: MastersRoiInputs = { ...DEFAULT_INPUTS };
  for (const key of Object.keys(URL_PARAM_KEYS) as MastersRoiInputKey[]) {
    const raw = params.get(URL_PARAM_KEYS[key]);
    if (raw === null || raw.trim() === "") continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    const field = getField(key);
    const shown = toDisplayValue(field, value);
    if (shown < field.min || shown > field.max) continue;
    inputs[key] = value;
  }
  const cur = params.get(CURRENCY_PARAM);
  const currency = cur && isCurrencyCode(cur) ? cur : DEFAULT_CURRENCY;
  return { inputs, currency };
}

/**
 * Serialises state to a query string, omitting values equal to the defaults
 * so the canonical calculator URL stays clean.
 */
export function serializeUrlState(state: MastersRoiUrlState): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(URL_PARAM_KEYS) as MastersRoiInputKey[]) {
    const value = state.inputs[key];
    if (value !== DEFAULT_INPUTS[key]) params.set(URL_PARAM_KEYS[key], String(value));
  }
  if (state.currency !== DEFAULT_CURRENCY) params.set(CURRENCY_PARAM, state.currency);
  return params.toString();
}
