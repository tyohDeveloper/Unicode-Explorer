import unassigned from "../data/unassigned.json";
import { isInSortedRanges } from "../codepoint/isInSortedRanges.js";

/** True for unassigned code points inside a block (generated from UnicodeData.txt). */
export function isReserved(cp: number): boolean {
  return isInSortedRanges(cp, unassigned.ranges);
}
