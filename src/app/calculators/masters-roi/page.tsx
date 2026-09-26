import { CalculatorPageShell } from "@/components/calculator/CalculatorPageShell";
import { MastersRoiCalculator } from "@/features/masters-roi/MastersRoiCalculator";
import { MASTERS_ROI_FAQ, MASTERS_ROI_METHODOLOGY, MASTERS_ROI_SEO } from "@/lib/calculators/masters-roi/content";
import { getCalculator } from "@/lib/calculators/registry";
import { buildPageMetadata } from "@/lib/seo";

const calc = getCalculator("masters-roi");

export const metadata = buildPageMetadata({
  title: MASTERS_ROI_SEO.title,
  description: MASTERS_ROI_SEO.description,
  path: calc.path,
  keywords: MASTERS_ROI_SEO.keywords,
});

export default function MastersRoiPage() {
  return (
    <CalculatorPageShell
      calc={calc}
      seoDescription={MASTERS_ROI_SEO.description}
      methodology={MASTERS_ROI_METHODOLOGY}
      faq={MASTERS_ROI_FAQ}
      intro={
        <>
          Is a master&apos;s degree worth it for you? Estimate the full cost — tuition, living expenses and the salary you give
          up — then see your break-even period and your financial position 5 and 10 years after graduating, under optimistic,
          expected and conservative scenarios.
        </>
      }
    >
      <MastersRoiCalculator />
    </CalculatorPageShell>
  );
}
