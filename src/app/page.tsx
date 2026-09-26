import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { calculators } from "@/lib/calculators/registry";
import { DEFAULT_INPUTS } from "@/lib/calculators/masters-roi/defaults";
import { calculateMastersRoi } from "@/lib/calculators/masters-roi/engine";
import { formatCurrency, formatSignedCurrency, formatYears } from "@/lib/format";
import { buildPageMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: `${siteConfig.name} — Transparent calculators for financial and career decisions`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

const principles = [
  {
    title: "Transparent formulas",
    body: "Every result links back to a published formula. You can check each step instead of trusting a black box.",
  },
  {
    title: "Deterministic, not AI-generated",
    body: "Math runs in plain, unit-tested code. The same inputs always give the same answer — no language model does the arithmetic.",
  },
  {
    title: "Scenarios, not single guesses",
    body: "See optimistic, expected and conservative outcomes side by side, so one hopeful assumption can't carry the decision.",
  },
  {
    title: "Private by design",
    body: "Calculations run in your browser with no sign-up. Your inputs are only stored if you choose to save a calculation — anonymously, under a random link.",
  },
];

const steps = [
  { n: "1", title: "Enter your numbers", body: "Salary, costs, funding and timing — only what the model actually needs." },
  { n: "2", title: "Compare scenarios", body: "Break-even, 5- and 10-year impact across optimistic, expected and conservative cases." },
  { n: "3", title: "Find what matters", body: "Sensitivity analysis ranks which assumptions move the answer most, so you know what to research." },
];

export default function HomePage() {
  // Computed at build time with the same engine the calculator uses.
  const example = calculateMastersRoi(DEFAULT_INPUTS);

  return (
    <>
      <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />

      <section className="border-b border-line bg-surface">
        <Container className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Badge tone="accent">Now live: Master&apos;s ROI and Job Switch calculators</Badge>
            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl">
              Big decisions deserve math you can see.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              DecisionLens turns major financial and career choices into transparent models. Enter your own numbers, compare
              scenarios, and see exactly which assumptions drive the answer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/calculators/masters-roi"
                className="rounded-lg bg-accent px-5 py-3 font-medium text-accent-ink shadow-sm hover:opacity-90"
              >
                Is a master&apos;s worth it? Calculate →
              </Link>
              <Link
                href="/calculators/job-switch-roi"
                className="rounded-lg border border-line-strong px-5 py-3 font-medium text-ink hover:bg-surface-2"
              >
                Should I switch jobs? →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-page p-6 shadow-sm" aria-label="Example result">
            <p className="text-xs font-semibold tracking-wide text-ink-3 uppercase">Example · Master&apos;s ROI</p>
            <p className="mt-2 text-sm text-ink-2">
              {formatCurrency(DEFAULT_INPUTS.currentSalary)} salary today, {formatCurrency(DEFAULT_INPUTS.postDegreeSalary)} expected after
              graduating. The program lasts {formatYears(DEFAULT_INPUTS.studyDurationYears)} and costs{" "}
              {formatCurrency(DEFAULT_INPUTS.tuition)} in tuition.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Net investment", formatCurrency(example.netInvestment)],
                [
                  "Break-even",
                  example.breakEven.yearsAfterGraduation === null ? "Not reached" : formatYears(example.breakEven.yearsAfterGraduation),
                ],
                ["5-year impact", formatSignedCurrency(example.impact5Year)],
                ["10-year impact", formatSignedCurrency(example.impact10Year)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line bg-surface p-3">
                  <dt className="text-xs text-ink-3">{label}</dt>
                  <dd className="tabular mt-1 text-lg font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-ink-3">
              Opportunity cost — the salary given up while studying — is {formatCurrency(example.opportunityCost)}, more than the
              tuition itself.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20">
          <h2 id="how-title" className="text-3xl font-semibold tracking-tight">
            How DecisionLens works
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="rounded-2xl border border-line bg-surface p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {s.n}
                </span>
                <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="principles-title" className="mt-20">
          <h2 id="principles-title" className="text-3xl font-semibold tracking-tight">
            Built on principles, not persuasion
          </h2>
          <p className="mt-3 max-w-2xl text-ink-2">
            We don&apos;t tell you what to do. We show you what your own assumptions imply — and how fragile they are.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="rounded-2xl border border-line bg-surface p-6">
                <h3 className="font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="calculators-title" className="mt-20">
          <h2 id="calculators-title" className="text-3xl font-semibold tracking-tight">
            Calculators
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {calculators.map((c) => (
              <li key={c.slug} className="flex">
                {c.status === "live" ? (
                  <Link
                    href={c.path}
                    className="flex w-full flex-col rounded-2xl border border-accent/40 bg-surface p-6 ring-1 ring-accent/10 transition hover:border-accent hover:shadow-sm"
                  >
                    <Badge tone="positive">Live</Badge>
                    <h3 className="mt-3 font-semibold text-ink">{c.name}</h3>
                    <p className="mt-2 flex-1 text-sm text-ink-2">{c.tagline}</p>
                    <span className="mt-4 text-sm font-medium text-accent">Open calculator →</span>
                  </Link>
                ) : (
                  <div className="flex w-full flex-col rounded-2xl border border-dashed border-line-strong p-6">
                    <Badge>Coming soon</Badge>
                    <h3 className="mt-3 font-semibold text-ink-2">{c.name}</h3>
                    <p className="mt-2 text-sm text-ink-3">{c.tagline}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
