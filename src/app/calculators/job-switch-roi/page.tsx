import { CalculatorPageShell } from "@/components/calculator/CalculatorPageShell";
import { JobSwitchCalculator } from "@/features/job-switch-roi/JobSwitchCalculator";
import { JOB_SWITCH_FAQ, JOB_SWITCH_METHODOLOGY, JOB_SWITCH_SEO } from "@/lib/calculators/job-switch-roi/content";
import { getCalculator } from "@/lib/calculators/registry";
import { buildPageMetadata } from "@/lib/seo";

const calc = getCalculator("job-switch-roi");

export const metadata = buildPageMetadata({
  title: JOB_SWITCH_SEO.title,
  description: JOB_SWITCH_SEO.description,
  path: calc.path,
  keywords: JOB_SWITCH_SEO.keywords,
});

export default function JobSwitchRoiPage() {
  return (
    <CalculatorPageShell
      calc={calc}
      seoDescription={JOB_SWITCH_SEO.description}
      methodology={JOB_SWITCH_METHODOLOGY}
      faq={JOB_SWITCH_FAQ}
      intro={
        <>
          Should you take the new job? Compare your full current package with the offer — bonus, benefits and raises included —
          subtract what switching costs you once, and see when it pays off and where you&apos;ll stand 1, 3 and 5 years from now.
        </>
      }
    >
      <JobSwitchCalculator />
    </CalculatorPageShell>
  );
}
