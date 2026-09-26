/** Static copy for the Job Switch page: SEO text, methodology and FAQ. */

import type { FaqItem, MethodologyStep } from "../types";

export const JOB_SWITCH_SEO = {
  title: "Job Switch ROI Calculator — Should You Take the New Job?",
  description:
    "Free job switch calculator. Compare your current job with a new offer including bonus, benefits, signing bonus, unvested equity you'd leave behind, moving costs and raises. See the break-even point and 1-, 3- and 5-year financial impact.",
  keywords: [
    "job switch calculator",
    "should I take the new job",
    "job offer comparison calculator",
    "is a new job worth it",
    "salary increase calculator",
    "unvested equity job change",
    "signing bonus calculator",
  ],
} as const;

export const JOB_SWITCH_METHODOLOGY: readonly MethodologyStep[] = [
  {
    title: "1. Two paths from today",
    body: "We compare staying in your current job with switching, starting from the day you'd resign. Every result is the difference between the two paths: positive means switching leaves you better off.",
  },
  {
    title: "2. Total packages, not just salary",
    formula: "Package = Salary + Bonus + Benefits",
    body: "Bonuses and benefits often differ more between jobs than base salary does, so both sides are compared on their full yearly package.",
  },
  {
    title: "3. One-time switching cost",
    formula: "Compensation left behind + Moving costs − Signing bonus",
    body: "Everything that happens once, counted on the day you switch. It can be negative when a signing bonus more than covers what you give up.",
  },
  {
    title: "4. Income lost during the gap",
    formula: "Current package earned during the unpaid gap",
    body: "If there's time with no paycheck between the two jobs, the pay you would have earned by staying is part of the cost of switching.",
  },
  {
    title: "5. Annual pay increase",
    formula: "New package − Current package when the new job starts − Extra yearly costs",
    body: "Your first-year gain, measured against what staying would pay by then (including any raise during the gap), and after the new job's extra costs such as a longer commute.",
  },
  {
    title: "6. Raises on both paths",
    formula: "Package in year n = Starting package × (1 + raise rate)ⁿ",
    body: "Each path grows at its own raise rate, once a year — from today if you stay, from your start date if you switch. A faster-growing new job can overtake even if it starts lower.",
  },
  {
    title: "7. Cumulative impact and break-even",
    formula: "Advantage(t) = Switch cash(t) − Stay cash(t)",
    body: "We track the running difference between the two paths. The 1-, 3- and 5-year impacts are its value at those points. Break-even is the moment after which switching stays ahead for good — a temporary lead from a signing bonus that later disappears doesn't count.",
  },
  {
    title: "8. Scenarios and sensitivity",
    body: "The optimistic and conservative scenarios vary what's uncertain about the new job — bonus payout, raises, start date and moving costs — by the fixed amounts shown. The sensitivity analysis moves one input at a time and ranks inputs by how much they change the 5-year impact.",
  },
  {
    title: "9. What isn't included",
    body: "Taxes, inflation, equity price changes, clawback of a signing bonus if you leave early, and non-financial factors such as job security, learning, team and stress. Adjust inputs to reflect them where you can.",
  },
] as const;

export const JOB_SWITCH_FAQ: readonly FaqItem[] = [
  {
    question: "How do I know if switching jobs is worth it financially?",
    answer:
      "Compare total packages (salary, bonus and benefits), subtract what switching costs you once (compensation left behind, moving costs and any unpaid gap, minus a signing bonus), and account for different raise rates. This calculator does that month by month and shows when — if ever — switching stays ahead.",
  },
  {
    question: "How should I value unvested equity I'd leave behind?",
    answer:
      "Count the value of what would vest within the next year or so if you stayed, at a conservative share price. Equity that vests years from now is uncertain and you might leave before then anyway. Also include any bonus that would pay out soon.",
  },
  {
    question: "Why can switching look good at first and then fall behind?",
    answer:
      "A large signing bonus can put you ahead on day one, but if the new job pays less or grows more slowly, staying overtakes it. That's why break-even here is defined as the point after which switching stays ahead for good.",
  },
  {
    question: "What raise rate should I use?",
    answer:
      "Look at your own history of raises and ask the new employer about typical increases and promotion timelines. Use the sensitivity analysis to see how much the answer depends on it.",
  },
  {
    question: "Does this calculator use AI?",
    answer:
      "Not for the math. Every number comes from transparent, deterministic formulas, and the same inputs always give the same results. An optional AI Decision Analysis can explain your results when you click \"Analyze My Result\"; it can only interpret the calculator's numbers, never change them.",
  },
  {
    question: "Are my inputs stored?",
    answer:
      "Only if you choose to. Your inputs live in the page URL so you can bookmark or share a scenario. If you click \"Save calculation\", your inputs and the computed results are stored anonymously under a random link. If you click \"Analyze My Result\", your inputs and the calculated results are sent to our AI provider to write the explanation; DecisionLens doesn't store them. No account, name or email is collected.",
  },
] as const;
