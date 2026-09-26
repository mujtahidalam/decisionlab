/**
 * Static copy for the Master's ROI calculator page: SEO text, the
 * "How this calculation works" methodology and the FAQ. Kept as data so the
 * same content feeds the page, the JSON-LD FAQPage and tests.
 */

import type { FaqItem, MethodologyStep } from "../types";

export const MASTERS_ROI_SEO = {
  title: "Master's Degree ROI Calculator — Is a Master's Worth It?",
  description:
    "Free master's degree ROI calculator. Estimate total cost, opportunity cost, break-even period and 5- and 10-year financial impact, with optimistic, expected and conservative scenarios and a sensitivity analysis.",
  keywords: [
    "master's degree ROI calculator",
    "is a master's degree worth it",
    "graduate school ROI",
    "MBA ROI calculator",
    "opportunity cost of a master's degree",
    "master's degree break-even",
    "study abroad cost calculator",
  ],
} as const;

export const MASTERS_ROI_METHODOLOGY: readonly MethodologyStep[] = [
  {
    title: "1. Two paths from the same starting line",
    body:
      "We compare two futures that both start the day your program would begin. On the no-degree path you keep working at your current salary. On the degree path you study, pay the costs, then start a new job at your expected post-degree salary. Every result is the difference between these two paths.",
  },
  {
    title: "2. Total education cost",
    formula: "Tuition + (Annual living expenses × Study duration) − Scholarship",
    body:
      "The cash you pay to study. Tuition and scholarship are totals for the whole program; living expenses are per year. Costs are spread evenly across the study period.",
  },
  {
    title: "3. Opportunity cost",
    formula: "Salary you would have earned (with raises) from program start until your new job starts",
    body:
      "The income you give up. It covers the study period plus any months of job search after graduation, and includes the raises you would have received by staying.",
  },
  {
    title: "4. Net investment",
    formula: "Total education cost + Opportunity cost",
    body: "Everything the degree costs you by the time you start your post-degree job.",
  },
  {
    title: "5. Annual income increase",
    formula: "Post-degree salary − No-degree salary at the time the new job starts",
    body:
      "Your first-year salary premium. We compare against what you would be earning by then without the degree — not today's salary — so the increase isn't overstated.",
  },
  {
    title: "6. Salary growth",
    formula: "Salary in year n = Starting salary × (1 + growth rate)ⁿ",
    body:
      "Both salaries rise once a year by the growth rate you enter. Partial years (for example an 18-month program) are counted exactly.",
  },
  {
    title: "7. Cumulative advantage, break-even and 5/10-year impact",
    formula: "Advantage(t) = Degree-path cash(t) − No-degree cash(t)",
    body:
      "At the start of your new job the advantage equals minus your net investment. Each year the salary premium chips away at it. The break-even period is the time after graduation when the advantage first reaches zero, solved exactly rather than by rounding to whole years. The 5- and 10-year impacts are the advantage 5 and 10 years after graduation, with every cost already included.",
  },
  {
    title: "8. Scenarios and sensitivity",
    body:
      "Optimistic and conservative scenarios adjust your inputs by the fixed amounts shown next to each scenario. The sensitivity analysis moves one assumption at a time to a low and a high value while holding the others fixed, then ranks assumptions by how much they move the 10-year impact.",
  },
  {
    title: "9. What isn't included",
    body:
      "Taxes, inflation, discounting, student-loan interest, part-time work during study, employer sponsorship and non-financial benefits such as career options, visas or fulfilment. Adjust your inputs to reflect these (for example, use after-tax salaries) or weigh them alongside the numbers.",
  },
] as const;

export const MASTERS_ROI_FAQ: readonly FaqItem[] = [
  {
    question: "How do you calculate the ROI of a master's degree?",
    answer:
      "Add the total education cost (tuition plus living expenses minus scholarships) to the opportunity cost (salary you give up while studying) to get your net investment. Then compare how much more you earn each year after graduating against that investment. This calculator does this year by year with salary growth on both paths, and reports the break-even period and your net position 5 and 10 years after graduation.",
  },
  {
    question: "What is the opportunity cost of a master's degree?",
    answer:
      "It is the income you would have earned if you had kept working instead of studying — including the raises you would have received — for the length of the program plus any job search after graduation. For many students it is larger than tuition.",
  },
  {
    question: "What is a good break-even period for a master's degree?",
    answer:
      "There's no universal threshold, but shorter is better: a degree that pays back within 3–5 years of graduating is financially strong, while one that takes 15+ years depends heavily on non-financial benefits. Always check the conservative scenario too.",
  },
  {
    question: "Should I include living expenses as a cost?",
    answer:
      "Include the living costs you'll pay while studying. If you would pay similar costs anyway while working (for example, you'd stay in the same city), enter only the extra amount — otherwise the degree's cost is overstated.",
  },
  {
    question: "How do scholarships, assistantships and stipends affect ROI?",
    answer:
      "Enter all funding for the whole program in the scholarship field. It reduces the education cost directly. A fully funded program with a stipend can make the education cost zero or negative, leaving the opportunity cost as the main investment.",
  },
  {
    question: "Does this calculator use AI to calculate results?",
    answer:
      "No. Every number is computed by a transparent, deterministic formula that runs in your browser. The same inputs always give the same results, and every assumption is listed on the page.",
  },
  {
    question: "Are my inputs stored?",
    answer:
      "Only if you choose to. Calculations run in your browser, and your inputs live in the page URL so you can bookmark or share a scenario. If you click \"Save calculation\", your inputs and the computed results are stored anonymously under a random link so you can come back to them. No account, name or email is ever collected.",
  },
] as const;
