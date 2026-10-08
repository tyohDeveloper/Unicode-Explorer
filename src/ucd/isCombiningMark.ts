import marks from "../data/marks.json";
import { isInSortedRanges } from "../codepoint/isInSortedRanges.js";

/** True for General_Category Mn, Mc, Me: drawn on a dotted circle so the mark has a base. */
export function isCombiningMark(cp: number): boolean {
  return isInSortedRanges(cp, marks.ranges);
}
