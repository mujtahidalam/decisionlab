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

  // Group consecutive core fields by their optional section heading.
  const sections: { title?: string; fields: FieldDefinition<K>[] }[] = [];
  for (const field of core) {
    const last = sections[sections.length - 1];
    if (last && last.title === field.section) last.fields.push(field);
    else sections.push({ title: field.section, fields: [field] });
  }

  return (
    <div className="space-y-5">
      {sections.map((section, i) =>
        section.title ? (
          <div key={section.title} className={i > 0 ? "border-t border-line pt-5" : undefined}>
            <fieldset>
              <legend className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{section.title}</legend>
              <div className="mt-3 space-y-5">{section.fields.map(render)}</div>
            </fieldset>
          </div>
        ) : (
          <div key={`s${i}`} className="space-y-5">
            {section.fields.map(render)}
          </div>
        ),
      )}
      {advanced.length > 0 ? (
        <Disclosure summary={advancedLabel} forceOpen={advanced.some((f) => errors[f.key])}>
          <div className="space-y-5">{advanced.map(render)}</div>
        </Disclosure>
      ) : null}
    </div>
  );
}
