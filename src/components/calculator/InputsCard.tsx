"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/SelectField";
import type { FieldDefinition } from "@/lib/calculators/types";
import { CURRENCIES, currencySymbol, isCurrencyCode, type CurrencyCode } from "@/lib/format";
import { InputPanel } from "./InputPanel";

/** The standard "Your numbers" card: currency picker, config-driven inputs and a reset action. */
export function InputsCard<K extends string>({
  fields,
  values,
  errors,
  onChange,
  currency,
  onCurrencyChange,
  onReset,
}: {
  fields: readonly FieldDefinition<K>[];
  values: Record<K, number>;
  errors: Partial<Record<K, string>>;
  onChange: (key: K, value: number) => void;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onReset: () => void;
}) {
  return (
    <Card as="section" aria-labelledby="inputs-title">
      <CardHeader
        id="inputs-title"
        title="Your numbers"
        description="Results update as you type."
        action={
          <button type="button" onClick={onReset} className="rounded-md px-2 py-1 text-xs font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
            Reset
          </button>
        }
      />
      <div className="space-y-5">
        <SelectField
          label="Currency"
          value={currency}
          options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.label}` }))}
          onChange={(v) => isCurrencyCode(v) && onCurrencyChange(v)}
        />
        <InputPanel fields={fields} values={values} errors={errors} onChange={onChange} currencySymbol={currencySymbol(currency)} />
      </div>
    </Card>
  );
}
