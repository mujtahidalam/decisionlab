/** Strict parser for untrusted Master's ROI inputs (API request bodies). */

import { createInputParser, type ParseResult as GenericParseResult } from "../framework/input-parsing";
import { MASTERS_ROI_FIELDS } from "./fields";
import type { MastersRoiInputKey, MastersRoiInputs } from "./types";
import { validateMastersRoiInputs } from "./validation";

export type ParseResult = GenericParseResult<MastersRoiInputs>;

export const parseMastersRoiInputs = createInputParser<MastersRoiInputKey, MastersRoiInputs>({
  fields: MASTERS_ROI_FIELDS,
  validate: validateMastersRoiInputs,
});
