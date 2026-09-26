import type { ReactNode } from "react";

/** Two-column calculator shell: sticky inputs on the left, results on the right. Stacks on mobile. */
export function CalculatorLayout({ inputs, results }: { inputs: ReactNode; results: ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <aside aria-label="Your inputs" className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
        {inputs}
      </aside>
      <div className="min-w-0 space-y-6">{results}</div>
    </div>
  );
}
