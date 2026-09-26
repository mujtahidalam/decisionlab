import type { Assumption } from "@/lib/calculators/types";
import { formatValue, type CurrencyCode } from "@/lib/format";

/** Renders the assumptions an engine reported, verbatim. */
export function AssumptionList({ assumptions, currency }: { assumptions: readonly Assumption[]; currency: CurrencyCode }) {
  return (
    <dl className="divide-y divide-line">
      {assumptions.map((a) => (
        <div key={a.id} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:gap-4">
          <dt className="text-sm font-medium text-ink">{a.label}</dt>
          {a.value !== undefined ? (
            <dd className="tabular text-sm font-semibold text-ink sm:text-right">{formatValue(a.value, a.unit, currency)}</dd>
          ) : (
            <dd className="hidden sm:block" />
          )}
          <dd className="text-xs leading-relaxed text-ink-2 sm:col-span-2">{a.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
