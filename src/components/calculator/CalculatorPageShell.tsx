import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import type { CalculatorMeta, FaqItem, MethodologyStep } from "@/lib/calculators/types";
import { breadcrumbJsonLd, calculatorJsonLd, faqJsonLd } from "@/lib/seo";
import { FaqSection } from "./FaqSection";
import { MethodologySection } from "./MethodologySection";

/**
 * Server-rendered page frame shared by every calculator: breadcrumb, heading,
 * intro, the interactive calculator, "How this calculation works", FAQ,
 * disclaimer and structured data (WebApplication, FAQPage, BreadcrumbList).
 */
export function CalculatorPageShell({
  calc,
  seoDescription,
  intro,
  methodology,
  faq,
  children,
}: {
  calc: CalculatorMeta;
  seoDescription: string;
  intro: ReactNode;
  methodology: readonly MethodologyStep[];
  faq: readonly FaqItem[];
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={[
          calculatorJsonLd(calc, seoDescription),
          faqJsonLd(faq),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Calculators", path: "/calculators" },
            { name: calc.name, path: calc.path },
          ]),
        ]}
      />

      <div className="border-b border-line bg-surface">
        <Container className="py-10 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-xs text-ink-3">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-ink">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/calculators" className="hover:text-ink">Calculators</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink-2">{calc.shortName}</li>
            </ol>
          </nav>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{calc.name}</h1>
          <p className="mt-3 max-w-3xl text-ink-2 sm:text-lg">{intro}</p>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">{children}</Container>

      <Container className="space-y-20 py-12">
        <MethodologySection steps={methodology} />
        <FaqSection items={faq} />
        <p className="text-xs text-ink-3">
          This calculator provides educational estimates only and is not financial advice. Results depend entirely on the
          assumptions you enter.
        </p>
      </Container>
    </>
  );
}
