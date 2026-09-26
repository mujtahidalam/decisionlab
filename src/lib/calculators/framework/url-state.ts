/**
 * Generic shareable-URL codec: inputs + currency <-> query string.
 * Parsing is defensive — unknown, missing or out-of-range values fall back to
 * defaults — so a hand-edited or stale URL can never break a page.
 */

import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "../../format";
import type { FieldDefinition } from "../types";
import { findField, isWithinBounds, type Inputs } from "./bounds";

export const CURRENCY_PARAM = "cur";

export interface UrlState<I> {
  inputs: I;
  currency: CurrencyCode;
}

type ParamSource = { get(name: string): string | null };

export interface UrlCodec<I> {
  paramKeys: Readonly<Record<string, string>>;
  parse(params: ParamSource): UrlState<I>;
  serialize(state: UrlState<I>): string;
}

export function createUrlCodec<K extends string, I extends Inputs<K>>(config: {
  fields: readonly FieldDefinition<K>[];
  defaults: Readonly<I>;
  /** Short, stable query-parameter name for each input. Must be unique. */
  paramKeys: Readonly<Record<K, string>>;
}): UrlCodec<I> {
  const { fields, defaults, paramKeys } = config;
  const keys = Object.keys(paramKeys) as K[];
  const names = Object.values(paramKeys) as string[];
  if (new Set(names).size !== names.length || names.includes(CURRENCY_PARAM)) {
    throw new Error("URL parameter names must be unique and must not clash with the currency parameter.");
  }

  return {
    paramKeys,
    parse(params) {
      const inputs = { ...defaults } as I;
      for (const key of keys) {
        const raw = params.get(paramKeys[key]);
        if (raw === null || raw.trim() === "") continue;
        const value = Number(raw);
        if (!Number.isFinite(value) || !isWithinBounds(findField(fields, key), value)) continue;
        (inputs as Record<K, number>)[key] = value;
      }
      const cur = params.get(CURRENCY_PARAM);
      return { inputs, currency: cur && isCurrencyCode(cur) ? cur : DEFAULT_CURRENCY };
    },
    serialize(state) {
      const params = new URLSearchParams();
      for (const key of keys) {
        const value = state.inputs[key];
        if (value !== defaults[key]) params.set(paramKeys[key], String(value));
      }
      if (state.currency !== DEFAULT_CURRENCY) params.set(CURRENCY_PARAM, state.currency);
      return params.toString();
    },
  };
}
