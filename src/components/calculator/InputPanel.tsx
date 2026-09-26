"use client";

import { NumberField } from "@/components/ui/NumberField";
import { Disclosure } from "@/components/ui/Disclosure";
import { toDisplayValue, toModelValue } from "@/lib/calculators/field-units";
import type { FieldDefinition } from "@/lib/calculators/types";

export interface InputPanelProps<K extends string> {
  fields: readonly FieldDefinition<K>[];
  /** Current values in model units (percent as decimals). */
  values: Record<K, number>;
  errors: Partial<Record<K, string>>;
  /** Receives values in model units. */
  onChange: (key: K, value: number) => void;
  currencySymbol: string;
  advancedLabel?: string;
}

const suffixFor = (unit: FieldDefinition["unit"]) =>
  unit === "percent" ? "% / yr" : unit === "years" ? "years" : unit === "months" ? "months" : undefined;

/**
 * Generic, config-driven input form. Any calculator can render its inputs by
 * passing FieldDefinitions; unit handling and advanced grouping are automatic.
 */
export function InputPanel<K extends string>({
  fields,
  values,
  errors,
  onChange,
  currencySymbol,
  advancedLabel = "Advanced assumptions",
}: InputPanelProps<K>) {
  const render = (field: FieldDefinition<K>) => (
    <NumberField
      key={field.key}
      label={field.label}
      help={field.help}
      error={errors[field.key]}
      value={toDisplayValue(field, values[field.key])}
      onChange={(display) => onChange(field.key, Number.isFinite(display) ? toModelValue(field, display) : Number.NaN)}
      prefix={field.unit === "currency" ? currencySymbol : undefined}
      suffix={suffixFor(field.unit)}
      grouped={field.unit === "currency"}
    />
  );

  const core = fields.filter((f) => f.group === "core");
  const advanced = fields.filter((f) => f.group === "advanced");

  return (
    <div className="space-y-5">
      {core.map(render)}
      {advanced.length > 0 ? (
        <Disclosure summary={advancedLabel} defaultOpen={advanced.some((f) => errors[f.key])}>
          <div className="space-y-5">{advanced.map(render)}</div>
        </Disclosure>
      ) : null}
    </div>
  );
}
