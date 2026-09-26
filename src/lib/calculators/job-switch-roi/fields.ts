import type { FieldDefinition } from "../types";
import type { JobSwitchInputKey } from "./types";

const MONEY_MAX = 100_000_000;

/** Input configuration; bounds are display units and the single source of truth for validation. */
export const JOB_SWITCH_FIELDS: readonly FieldDefinition<JobSwitchInputKey>[] = [
  {
    key: "currentSalary",
    label: "Current annual salary",
    unit: "currency",
    help: "Your base salary today, before tax.",
    min: 0, max: MONEY_MAX, step: 1000, group: "core", section: "Current job",
  },
  {
    key: "currentBonus",
    label: "Current annual bonus",
    unit: "currency",
    help: "Cash bonus you realistically expect per year if you stay. Enter 0 if none.",
    min: 0, max: MONEY_MAX, step: 500, group: "core", section: "Current job",
  },
  {
    key: "currentGrowthRate",
    label: "Expected yearly raise if you stay",
    unit: "percent",
    help: "Average annual increase to your total pay in the current job.",
    min: -10, max: 25, step: 0.5, group: "core", section: "Current job",
  },
  {
    key: "newSalary",
    label: "New annual salary",
    unit: "currency",
    help: "Base salary in the offer.",
    min: 0, max: MONEY_MAX, step: 1000, group: "core", section: "New job",
  },
  {
    key: "newBonus",
    label: "New annual bonus",
    unit: "currency",
    help: "Target cash bonus in the offer. Many bonuses pay below target — the conservative scenario halves it.",
    min: 0, max: MONEY_MAX, step: 500, group: "core", section: "New job",
  },
  {
    key: "newGrowthRate",
    label: "Expected yearly raise in the new job",
    unit: "percent",
    help: "Average annual increase to your total pay after switching.",
    min: -10, max: 25, step: 0.5, group: "core", section: "New job",
  },
  {
    key: "signingBonus",
    label: "Signing bonus",
    unit: "currency",
    help: "One-time payment for joining. If it must be repaid when leaving early, count only what you're confident of keeping.",
    min: 0, max: MONEY_MAX, step: 500, group: "core", section: "The switch",
  },
  {
    key: "forfeitedCompensation",
    label: "Compensation you leave behind",
    unit: "currency",
    help: "Unvested equity, a bonus that would pay out soon, retention payments — anything you lose by resigning now.",
    min: 0, max: MONEY_MAX, step: 500, group: "core", section: "The switch",
  },
  {
    key: "relocationCost",
    label: "Moving costs you pay",
    unit: "currency",
    help: "Relocation, deposits, travel — after any relocation package from the new employer. Enter 0 if not moving.",
    min: 0, max: MONEY_MAX, step: 500, group: "core", section: "The switch",
  },
  {
    key: "gapMonths",
    label: "Unpaid gap between jobs",
    unit: "months",
    help: "Months with no paycheck between leaving and starting. Enter 0 for a seamless move.",
    min: 0, max: 24, step: 1, group: "core", section: "The switch",
  },
  {
    key: "currentBenefits",
    label: "Current benefits (yearly value)",
    unit: "currency",
    help: "Employer retirement contributions, health insurance, allowances — what you'd have to pay yourself without them.",
    min: 0, max: MONEY_MAX, step: 500, group: "advanced",
  },
  {
    key: "newBenefits",
    label: "New benefits (yearly value)",
    unit: "currency",
    help: "The same, for the new job's package.",
    min: 0, max: MONEY_MAX, step: 500, group: "advanced",
  },
  {
    key: "annualCostChange",
    label: "Extra yearly costs of the new job",
    unit: "currency",
    help: "Longer commute, higher rent, childcare. Use a negative number for savings, e.g. working remotely.",
    min: -MONEY_MAX, max: MONEY_MAX, step: 500, group: "advanced",
  },
] as const;
