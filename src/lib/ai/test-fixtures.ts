/** Test fixtures for the AI layer. Not imported by application code. */

import { buildMastersRoiAnalysisContext } from "../calculators/masters-roi/analysis-context";
import { DEFAULT_INPUTS } from "../calculators/masters-roi/defaults";
import type { LlmProvider, StructuredGenerationRequest } from "./providers/types";
import type { AnalysisContext, DecisionAnalysis } from "./types";

export const defaultContext = (): AnalysisContext => buildMastersRoiAnalysisContext({ ...DEFAULT_INPUTS }, "USD");

/** A well-formed analysis that only quotes numbers present in the default Master's context. */
export const validAnalysis = (): DecisionAnalysis => ({
  summary:
    "With a net investment of $177,650, the calculator estimates break-even 9 years 5 months after graduation and a 10-year impact of +$13,229.",
  key_drivers: ["The expected post-degree salary has the largest influence on the 10-year result.", "Opportunity cost of $111,650 is the biggest single cost."],
  risks: ["In the conservative scenario the 10-year impact is −$128,267."],
  sensitivity: ["The result is highly sensitive to the expected post-degree annual salary."],
  assumptions: ["Figures are nominal and pre-tax; taxes and inflation are not modelled."],
  questions_to_consider: ["How confident are you in the expected post-degree salary?"],
});

/** A provider double that records requests and returns (or throws) what it's told to. */
export function fakeProvider(respond: (req: StructuredGenerationRequest) => unknown | Promise<unknown>): LlmProvider & {
  calls: StructuredGenerationRequest[];
} {
  const calls: StructuredGenerationRequest[] = [];
  return {
    id: "fake:test",
    calls,
    async generateStructured(req) {
      calls.push(req);
      return respond(req);
    },
  };
}
