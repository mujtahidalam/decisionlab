import Link from "next/link";
import { FaqSection } from "@/components/calculator/FaqSection";
import { MethodologySection } from "@/components/calculator/MethodologySection";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { MastersRoiCalculator } from "@/features/masters-roi/MastersRoiCalculator";
import { MASTERS_ROI_FAQ, MASTERS_ROI_METHODOLOGY, MASTERS_ROI_SEO } from "@/lib/calculators/masters-roi/content";
import { getCalculator } from "@/lib/calculators/registry";
import { breadcrumbJsonLd, buildPageMetadata, calculatorJsonLd, faqJsonLd } from "@/lib/seo";

const calc = getCalculator("masters-roi");

export const metadata = buildPageMetadata({
  title: MASTERS_ROI_SEO.title,
  description: MASTERS_ROI_SEO.description,
  path: calc.path,
  keywords: MASTERS_ROI_SEO.keywords,
});

export default function MastersRoiPage() {
  return (
    <>
      <JsonLd
        data={[
          calculatorJsonLd(calc, MASTERS_ROI_SEO.description),
          faqJsonLd(MASTERS_ROI_FAQ),
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
          <p className="mt-3 max-w-3xl text-ink-2 sm:text-lg">
            Is a master&apos;s degree worth it for you? Estimate the full cost — tuition, living expenses and the salary you give
            up — then see your break-even period and your financial position 5 and 10 years after graduating, under
            optimistic, expected and conservative scenarios.
          </p>
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        <MastersRoiCalculator />
      </Container>

      <Container className="space-y-20 py-12">
        <MethodologySection steps={MASTERS_ROI_METHODOLOGY} />
        <FaqSection items={MASTERS_ROI_FAQ} />
        <p className="text-xs text-ink-3">
          This calculator provides educational estimates only and is not financial advice. Results depend entirely on the
          assumptions you enter.
        </p>
      </Container>
    </>
  );
}
