import Link from "next/link";
import { calculators } from "@/lib/calculators/registry";
import { Container } from "./Container";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <Container className="grid gap-8 py-10 sm:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-md text-sm text-ink-2">
            Transparent, deterministic models for financial and career decisions. Every number is computed by
            published formulas — no AI guesses, no black boxes.
          </p>
          <p className="max-w-md text-xs text-ink-3">
            DecisionLens provides educational estimates, not financial, legal or tax advice. Results depend
            entirely on the assumptions you enter.
          </p>
        </div>
        <nav aria-label="Calculators">
          <h2 className="text-sm font-semibold text-ink">Calculators</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {calculators.map((c) => (
              <li key={c.slug}>
                {c.status === "live" ? (
                  <Link href={c.path} className="text-ink-2 hover:text-ink">
                    {c.name}
                  </Link>
                ) : (
                  <span className="text-ink-3">
                    {c.name} <span className="text-xs">(coming soon)</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="border-t border-line py-4 text-xs text-ink-3">
        © {new Date().getFullYear()} DecisionLens
      </Container>
    </footer>
  );
}
