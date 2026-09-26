import type { CalculatorMeta } from "./types";

/**
 * Single source of truth for which calculators exist.
 * Drives the landing page, the /calculators directory, navigation and sitemap.xml.
 *
 * To add a calculator, append an entry here (see docs/ARCHITECTURE.md §6).
 */
export const calculators: readonly CalculatorMeta[] = [
  {
    slug: "masters-roi",
    path: "/calculators/masters-roi",
    name: "Master's Degree ROI Calculator",
    shortName: "Master's ROI",
    tagline: "Is a master's degree worth it for you?",
    description:
      "Estimate the total cost, opportunity cost, break-even period and 5- and 10-year financial impact of a master's degree, with optimistic, expected and conservative scenarios.",
    category: "Education",
    status: "live",
  },
  {
    slug: "job-switch-roi",
    path: "/calculators/job-switch-roi",
    name: "Job Switch ROI Calculator",
    shortName: "Job switch",
    tagline: "Is the new job worth leaving for?",
    description:
      "Compare your current package with a new offer — bonus, benefits, raises, signing bonus, equity left behind and moving costs — and see the break-even point and 1-, 3- and 5-year financial impact.",
    category: "Career",
    status: "live",
  },
  {
    slug: "job-offer-comparison",
    path: "/calculators/job-offer-comparison",
    name: "Job Offer Comparison",
    shortName: "Job offers",
    tagline: "Compare total compensation across offers.",
    description: "Compare salary, bonus, equity, benefits and cost of living across job offers.",
    category: "Career",
    status: "coming-soon",
  },
  {
    slug: "career-switch",
    path: "/calculators/career-switch",
    name: "Career Switch Calculator",
    shortName: "Career switch",
    tagline: "Model the cost of changing careers.",
    description: "Estimate the runway, retraining cost and payback period of switching careers.",
    category: "Career",
    status: "coming-soon",
  },
  {
    slug: "rent-vs-buy",
    path: "/calculators/rent-vs-buy",
    name: "Rent vs. Buy Calculator",
    shortName: "Rent vs. buy",
    tagline: "See when buying beats renting.",
    description: "Compare the long-run cost of renting and buying a home.",
    category: "Housing",
    status: "coming-soon",
  },
] as const;

export const liveCalculators = (): CalculatorMeta[] =>
  calculators.filter((c) => c.status === "live");

export function getCalculator(slug: string): CalculatorMeta {
  const calc = calculators.find((c) => c.slug === slug);
  if (!calc) throw new Error(`Unknown calculator: ${slug}`);
  return calc;
}
