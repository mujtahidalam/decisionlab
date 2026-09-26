import type { ReactNode } from "react";

/** Native <details> disclosure: accessible, works without JavaScript. */
export function Disclosure({ summary, children, defaultOpen = false }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-xl border border-line bg-surface-2/50" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        {summary}
        <svg className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="px-4 pt-1 pb-4">{children}</div>
    </details>
  );
}
