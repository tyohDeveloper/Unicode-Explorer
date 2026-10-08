import nonVisible from "../../data/non-visible-ranges.json";
import { isNoncharacter } from "../codepoint/isNoncharacter.js";
import { parseHexRanges } from "../codepoint/parseHexRanges.js";

const ranges = parseHexRanges(nonVisible.ranges);

/** True for code points that produce no visible glyph; hidden unless "Include non-visible". */
export function isNonVisible(cp: number): boolean {
  if (nonVisible.noncharacter_tail && isNoncharacter(cp)) return true;
  return ranges.some((r) => cp >= r.start && cp <= r.end);
}
