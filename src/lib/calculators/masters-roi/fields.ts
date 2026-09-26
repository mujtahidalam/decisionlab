import type { FieldDefinition } from "../types";
import type { MastersRoiInputKey } from "./types";

/**
 * Input field configuration. Bounds are in display units (percent fields in %).
 * These bounds are also the single source of truth for validation.
 */
export const MASTERS_ROI_FIELDS: readonly FieldDefinition<MastersRoiInputKey>[] = [
  {
    key: "currentSalary",
    label: "Current annual salary",
    unit: "currency",
    help: "What you earn per year today — the income you give up while studying. Enter 0 if you're not working.",
    min: 0,
    max: 100_000_000,
    step: 1000,
    group: "core",
  },
  {
    key: "postDegreeSalary",
    label: "Expected post-degree annual salary",
    unit: "currency",
    help: "Your realistic starting salary in the first job after graduating. Use program employment reports or job listings.",
    min: 0,
    max: 100_000_000,
    step: 1000,
    group: "core",
  },
  {
    key: "tuition",
    label: "Tuition (whole program)",
    unit: "currency",
    help: "Total tuition and mandatory fees for the entire program, not per year.",
    min: 0,
    max: 100_000_000,
    step: 1000,
    group: "core",
  },
  {
    key: "livingExpenses",
    label: "Annual living expenses while studying",
    unit: "currency",
    help: "Rent, food, insurance and other costs per year of study. If you'd pay similar costs anyway while working, enter only the extra amount for a stricter comparison.",
    min: 0,
    max: 100_000_000,
    step: 500,
    group: "core",
  },
  {
    key: "scholarship",
    label: "Scholarship or funding (whole program)",
    unit: "currency",
    help: "Total scholarships, grants, assistantship stipends or tuition waivers over the program.",
    min: 0,
    max: 100_000_000,
    step: 1000,
    group: "core",
  },
  {
    key: "studyDurationYears",
    label: "Study duration",
    unit: "years",
    help: "Program length in years. Fractions are fine — e.g. 1.5 for an 18-month program.",
    min: 0.25,
    max: 6,
    step: 0.25,
    group: "core",
  },
  {
    key: "salaryGrowthRate",
    label: "Expected annual salary growth",
    unit: "percent",
    help: "Average yearly raise, applied to both paths (with and without the degree).",
    min: -10,
    max: 25,
    step: 0.5,
    group: "core",
  },
  {
    key: "jobSearchMonths",
    label: "Job search after graduation",
    unit: "months",
    help: "Months between graduating and your first post-degree paycheck. The degree path earns nothing during this gap, while the no-degree path keeps earning.",
    min: 0,
    max: 24,
    step: 1,
    group: "advanced",
  },
] as const;

export function getField(key: MastersRoiInputKey): FieldDefinition<MastersRoiInputKey> {
  const field = MASTERS_ROI_FIELDS.find((f) => f.key === key);
  if (!field) throw new Error(`Unknown field: ${key}`);
  return field;
}
