/**
 * Presentation-only formatting helpers. Nothing here changes a calculated value;
 * rounding happens at display time only.
 */

import type { ValueUnit } from "./calculators/types";

export const CURRENCIES = [
  { code: "USD", label: "US dollar", locale: "en-US" },
  { code: "EUR", label: "Euro", locale: "de-DE" },
  { code: "GBP", label: "British pound", locale: "en-GB" },
  { code: "CAD", label: "Canadian dollar", locale: "en-CA" },
  { code: "AUD", label: "Australian dollar", locale: "en-AU" },
  { code: "INR", label: "Indian rupee", locale: "en-IN" },
  { code: "BDT", label: "Bangladeshi taka", locale: "en-IN" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCIES.some((c) => c.code === value);
}

function localeFor(currency: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === currency)?.locale ?? "en-US";
}

/** Normalises -0 to 0 so we never display "-$0". */
function noNegativeZero(value: number): number {
  return Object.is(value, -0) || Math.abs(value) < 0.5 ? 0 : value;
}

/** Full currency amount with no decimals, e.g. "$75,000" or "−$12,300". */
export function formatCurrency(value: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(noNegativeZero(value));
}

/** Compact currency for charts and tight spaces, e.g. "$1.2M". */
export function formatCurrencyCompact(value: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(localeFor(currency), {
    style: "currency",
    currency,
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(noNegativeZero(value));
}

/** Currency with an explicit sign for gains/losses, e.g. "+$4,000". */
export function formatSignedCurrency(value: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const v = noNegativeZero(value);
  const formatted = formatCurrency(Math.abs(v), currency);
  if (v > 0) return `+${formatted}`;
  if (v < 0) return `−${formatted}`;
  return formatted;
}

/** Percent from a decimal rate, e.g. 0.035 → "3.5%". */
export function formatPercent(rate: number, maxDecimals = 1): string {
  const value = Math.round(rate * 100 * 10 ** maxDecimals) / 10 ** maxDecimals;
  return `${noNegativeZero(value) === 0 ? 0 : value}%`;
}

/** Durations in years as "2 years", "1.5 years", or "1 year 4 months" style. */
export function formatYears(years: number): string {
  const totalMonths = Math.round(years * 12);
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const yPart = y === 1 ? "1 year" : `${y} years`;
  const mPart = m === 1 ? "1 month" : `${m} months`;
  if (y === 0) return mPart;
  if (m === 0) return yPart;
  return `${yPart} ${mPart}`;
}

/** Compact duration for tight layouts: "9 yr 5 mo", "2 yr", "3 mo". */
export function formatYearsShort(years: number): string {
  const totalMonths = Math.round(years * 12);
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
}

export function formatMonths(months: number): string {
  const m = Math.round(months);
  return m === 1 ? "1 month" : `${m} months`;
}

export function formatMultiplier(value: number): string {
  return `${(Math.round(value * 100) / 100).toFixed(2)}×`;
}

/** Formats any value according to its unit. */
export function formatValue(value: number, unit: ValueUnit, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  switch (unit) {
    case "currency":
      return formatCurrency(value, currency);
    case "percent":
      return formatPercent(value);
    case "years":
      return formatYears(value);
    case "months":
      return formatMonths(value);
    case "multiplier":
      return formatMultiplier(value);
    case "text":
      return String(value);
  }
}

/** The symbol (or code) a currency uses in its locale, e.g. "$", "€", "BDT". */
export function currencySymbol(currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const parts = new Intl.NumberFormat(localeFor(currency), { style: "currency", currency }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}
