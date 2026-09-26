import { describe, expect, it } from "vitest";
import { toDisplayValue, toModelValue } from "./calculators/field-units";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatMonths,
  formatMultiplier,
  formatPercent,
  formatSignedCurrency,
  formatYears,
  formatYearsShort,
  isCurrencyCode,
} from "./format";

describe("formatting", () => {
  it("formats currency without decimals", () => {
    expect(formatCurrency(75_000)).toBe("$75,000");
    expect(formatCurrency(1234.56)).toBe("$1,235");
  });

  it("never shows negative zero", () => {
    expect(formatCurrency(-0.2)).toBe("$0");
    expect(formatSignedCurrency(-0.2)).toBe("$0");
  });

  it("formats signed currency", () => {
    expect(formatSignedCurrency(4_000)).toBe("+$4,000");
    expect(formatSignedCurrency(-4_000)).toBe("−$4,000");
  });

  it("formats percentages from decimal rates", () => {
    expect(formatPercent(0.035)).toBe("3.5%");
    expect(formatPercent(0.1)).toBe("10%");
    expect(formatPercent(-0.01)).toBe("-1%");
  });

  it("formats durations", () => {
    expect(formatYears(2)).toBe("2 years");
    expect(formatYears(1)).toBe("1 year");
    expect(formatYears(1.5)).toBe("1 year 6 months");
    expect(formatYears(0.25)).toBe("3 months");
    expect(formatYears(7.75)).toBe("7 years 9 months");
    expect(formatMonths(1)).toBe("1 month");
    expect(formatYearsShort(9.391)).toBe("9 yr 5 mo");
    expect(formatYearsShort(2)).toBe("2 yr");
    expect(formatYearsShort(0.25)).toBe("3 mo");
    expect(formatMultiplier(0.0745)).toBe("0.07×");
  });

  it("validates currency codes", () => {
    expect(isCurrencyCode("BDT")).toBe(true);
    expect(isCurrencyCode("XYZ")).toBe(false);
  });
});

describe("field unit conversion", () => {
  it("converts percent fields between model and display units without float noise", () => {
    expect(toDisplayValue({ unit: "percent" }, 0.035)).toBe(3.5);
    expect(toModelValue({ unit: "percent" }, 3.5)).toBe(0.035);
    expect(toDisplayValue({ unit: "currency" }, 1000)).toBe(1000);
  });
});

describe("compact currency", () => {
  it("drops trailing zero decimals consistently across ICU builds", () => {
    expect(formatCurrencyCompact(200_000)).toBe("$200K");
    expect(formatCurrencyCompact(-150_000)).toBe("-$150K");
    expect(formatCurrencyCompact(1_250_000)).toBe("$1.3M");
    expect(formatCurrencyCompact(0)).toBe("$0");
  });
});
