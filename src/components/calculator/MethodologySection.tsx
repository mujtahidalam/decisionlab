import type { MethodologyStep } from "@/lib/calculators/types";

/** "How this calculation works" — static, server-rendered and crawlable. */
export function MethodologySection({ steps, id = "how-it-works", title = "How this calculation works" }: { steps: readonly MethodologyStep[]; id?: string; title?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-ink-2">
        Every number above comes from the formulas below, computed deterministically in your browser. No AI is involved in
        the math — the same inputs always produce the same results.
      </p>
      <ol className="mt-8 grid gap-4 md:grid-cols-2">
        {steps.map((s) => (
          <li key={s.title} className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-semibold text-ink">{s.title}</h3>
            {s.formula ? (
              <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs leading-relaxed text-ink">{s.formula}</p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
