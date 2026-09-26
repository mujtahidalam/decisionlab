import type { SensitivityAnalysis } from "@/lib/calculators/types";
import { formatSignedCurrency, formatValue, type CurrencyCode } from "@/lib/format";

const LOW_COLOR = "var(--series-1)";
const HIGH_COLOR = "var(--series-2)";

/**
 * Tornado chart for a one-at-a-time sensitivity analysis.
 *
 * Each row shows how the output moves when one assumption is set to its low
 * (blue) and high (orange) test value. Bars start at the user's baseline; the
 * widest rows are the assumptions the answer depends on most. All values are
 * also printed as text, so colour never carries meaning alone.
 */
export function TornadoChart({ analysis, currency }: { analysis: SensitivityAnalysis; currency: CurrencyCode }) {
  const { baseline, rows } = analysis;
  const maxDelta = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.lowOutcome - baseline), Math.abs(r.highOutcome - baseline)]));
  // Baseline sits at the centre; ±maxDelta spans each half.
  const pos = (v: number) => 50 + ((v - baseline) / maxDelta) * 50;

  const bar = (value: number, color: string, label: string) => {
    const a = pos(baseline);
    const b = pos(value);
    const left = Math.min(a, b);
    const width = Math.abs(b - a);
    return (
      <div
        className="absolute h-2.5 rounded-[3px]"
        style={{ left: `${left}%`, width: `max(${width}%, ${width > 0 ? "2px" : "0px"})`, background: color }}
        title={label}
      />
    );
  };

  return (
    <figure className="m-0">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: LOW_COLOR }} aria-hidden="true" />
          Assumption at low value
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: HIGH_COLOR }} aria-hidden="true" />
          Assumption at high value
        </span>
        <span className="text-ink-3">
          Centre line = your {analysis.metricLabel.toLowerCase()} ({formatSignedCurrency(baseline, currency)})
        </span>
      </div>

      <ol className="space-y-4">
        {rows.map((r, idx) => {
          const lowText = `${formatValue(r.lowInput, r.unit, currency)} → ${formatSignedCurrency(r.lowOutcome, currency)}`;
          const highText = `${formatValue(r.highInput, r.unit, currency)} → ${formatSignedCurrency(r.highOutcome, currency)}`;
          return (
            <li key={r.id} className="grid gap-2 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  <span className="mr-1.5 text-ink-3 tabular">{idx + 1}.</span>
                  {r.label}
                </p>
                <p className="text-xs text-ink-3">
                  Tested {r.rangeLabel} · swing {formatValue(r.swing, "currency", currency)}
                </p>
              </div>
              <div>
                <div className="relative h-7" aria-hidden="true">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                  <div className="absolute inset-x-0 top-1">{bar(r.lowOutcome, LOW_COLOR, lowText)}</div>
                  <div className="absolute inset-x-0 top-4">{bar(r.highOutcome, HIGH_COLOR, highText)}</div>
                </div>
                <p className="tabular mt-1 flex flex-wrap justify-between gap-x-3 text-[11px] text-ink-2">
                  <span>Low: {lowText}</span>
                  <span>High: {highText}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-4 text-xs text-ink-3">
        Each assumption is changed on its own while all others stay at your inputs. Assumptions are ranked by swing — the
        gap between the low and high result.
      </figcaption>
    </figure>
  );
}
