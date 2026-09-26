/** Presentation helpers shared by calculator containers (no math). */

import type { ScenarioId } from "@/lib/calculators/framework/scenarios";

/** Scenario colours: fixed per scenario so they never repaint when data changes. */
export const SCENARIO_COLORS: Record<ScenarioId, string> = {
  optimistic: "var(--series-3)",
  expected: "var(--series-1)",
  conservative: "var(--series-2)",
};

export type Tone = "positive" | "negative" | "neutral";

/** Colour tone for a signed amount; values within ±0.5 display as zero and stay neutral. */
export const toneOf = (v: number): Tone => (v > 0.5 ? "positive" : v < -0.5 ? "negative" : "neutral");
