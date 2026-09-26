import Link from "next/link";
import { liveCalculators } from "@/lib/calculators/registry";
import { Container } from "./Container";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur supports-[backdrop-filter]:bg-page/70">
      <Container className="flex h-14 items-center justify-between gap-3">
        <Link href="/" className="shrink-0 text-ink" aria-label="DecisionLens home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          {liveCalculators().map((c) => (
            <Link key={c.slug} href={c.path} className="hidden rounded-md px-3 py-2 whitespace-nowrap text-ink-2 hover:bg-surface-2 hover:text-ink md:inline-block">
              {c.shortName}
            </Link>
          ))}
          <Link href="/calculators" className="rounded-md bg-accent px-3 py-2 font-medium whitespace-nowrap text-accent-ink hover:opacity-90">
            Calculators
          </Link>
        </nav>
      </Container>
    </header>
  );
}
