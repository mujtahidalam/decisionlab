export interface ScenarioColumn {
  id: string;
  label: string;
  summary: string;
  adjustments: readonly string[];
  /** CSS colour (usually a series var) used for the column's identity swatch. */
  color: string;
  highlighted?: boolean;
}

export interface ScenarioRow {
  label: string;
  values: readonly string[];
  tones?: readonly ("neutral" | "positive" | "negative")[];
}

const toneClass = { neutral: "text-ink", positive: "text-positive", negative: "text-negative" } as const;

/** Side-by-side comparison of scenario outcomes plus what each scenario changes. */
export function ScenarioTable({ columns, rows, caption }: { columns: readonly ScenarioColumn[]; rows: readonly ScenarioRow[]; caption: string }) {
  return (
    <div className="space-y-5">
      {/* Phones: metric label on its own line, three values beneath it. */}
      <div className="sm:hidden">
        <div className="grid grid-cols-3 gap-2 border-b border-line pb-2 text-[11px] font-semibold text-ink" aria-hidden="true">
          {columns.map((c) => (
            <span key={c.id} className="flex items-center justify-end gap-1">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
              {c.label}
            </span>
          ))}
        </div>
        <dl className="tabular">
          {rows.map((row) => (
            <div key={row.label} className="border-b border-line py-2.5 last:border-b-0">
              <dt className="text-xs text-ink-2">{row.label}</dt>
              <dd className="mt-1 grid grid-cols-3 gap-2 text-right text-sm font-medium">
                {row.values.map((v, i) => (
                  <span key={columns[i]?.id ?? i} className={toneClass[row.tones?.[i] ?? "neutral"]}>
                    <span className="sr-only">{columns[i]?.label}: </span>
                    {v}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="hidden sm:block">
        <table className="tabular w-full border-collapse text-xs sm:text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[34%] py-2 pr-2 pl-5 text-left text-xs font-medium text-ink-3 sm:px-3">
                Metric
              </th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`px-2 py-2 text-right text-xs font-semibold last:pr-5 sm:px-3 sm:last:pr-3 text-ink ${c.highlighted ? "bg-surface-2 rounded-t-lg" : ""}`}
                >
                  <span className="inline-flex items-center justify-end gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                    {c.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <th scope="row" className="py-2.5 pr-2 pl-5 text-left font-normal text-ink-2 sm:px-3">
                  {row.label}
                </th>
                {row.values.map((v, i) => (
                  <td
                    key={columns[i]?.id ?? i}
                    className={`px-2 py-2.5 text-right font-medium last:pr-5 sm:px-3 sm:last:pr-3 ${toneClass[row.tones?.[i] ?? "neutral"]} ${
                      columns[i]?.highlighted ? "bg-surface-2" : ""
                    }`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {columns.map((c) => (
          <li key={c.id} className="rounded-xl border border-line p-3 text-xs">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} aria-hidden="true" />
              {c.label}
            </p>
            <p className="mt-1 text-ink-2">{c.summary}</p>
            {c.adjustments.length > 0 ? (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-ink-2">
                {c.adjustments.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
