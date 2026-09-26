import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur supports-[backdrop-filter]:bg-page/70">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="text-ink" aria-label="DecisionLens home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <Link href="/calculators" className="hidden rounded-md px-3 py-2 text-ink-2 hover:bg-surface-2 hover:text-ink min-[400px]:inline-block">
            Calculators
          </Link>
          <Link
            href="/calculators/masters-roi"
            className="rounded-md bg-accent px-3 py-2 font-medium whitespace-nowrap text-accent-ink hover:opacity-90"
          >
            Master&apos;s ROI
          </Link>
        </nav>
      </Container>
    </header>
  );
}
