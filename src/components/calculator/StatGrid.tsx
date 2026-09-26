import type { ReactNode } from "react";

export interface StatItem {
  id: string;
  label: string;
  value: string;
  detail?: ReactNode;
  tone?: "neutral" | "positive" | "negative";
}

const toneClass = {
  neutral: "text-ink",
  positive: "text-positive",
  negative: "text-negative",
} as const;

/** Grid of headline metrics. Tone colours values but meaning is always in the text too. */
export function StatGrid({ items, columns = 4 }: { items: readonly StatItem[]; columns?: 2 | 3 | 4 }) {
  const cols = { 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-1 min-[420px]:grid-cols-2" }[columns];
  return (
    <dl className={`grid gap-3 ${cols}`}>
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-line bg-surface p-4">
          <dt className="text-xs font-medium tracking-wide text-ink-3 uppercase">{item.label}</dt>
          <dd className={`tabular mt-1.5 text-xl font-semibold break-words sm:text-2xl tracking-tight ${toneClass[item.tone ?? "neutral"]}`}>{item.value}</dd>
          {item.detail ? <dd className="mt-1 text-xs leading-relaxed text-ink-2">{item.detail}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
