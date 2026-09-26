import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-ink-2">That page doesn&apos;t exist — but our calculators do.</p>
      <Link href="/calculators" className="mt-6 inline-block rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-ink">
        Browse calculators
      </Link>
    </Container>
  );
}
