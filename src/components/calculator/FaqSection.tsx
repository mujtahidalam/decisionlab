import type { FaqItem } from "@/lib/calculators/types";

/** FAQ rendered with native disclosures; content mirrors the FAQPage JSON-LD. */
export function FaqSection({ items, id = "faq" }: { items: readonly FaqItem[]; id?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Frequently asked questions
      </h2>
      <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
        {items.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
              <h3>{item.question}</h3>
              <span className="mt-0.5 text-ink-3 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
