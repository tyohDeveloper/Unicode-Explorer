import labels from "../../data/category-labels.json";
import { formatHex } from "../codepoint/formatHex.js";
import { isNoncharacter } from "../codepoint/isNoncharacter.js";
import { parseHexRanges } from "../codepoint/parseHexRanges.js";

const ranges = parseHexRanges(labels.ranges);

/** "<control-0000>" style label for nameless code points; null when none applies. */
export function categoryLabel(cp: number): string | null {
  const range = ranges.find((r) => cp >= r.start && cp <= r.end);
  if (range) return `<${range.label}-${formatHex(cp)}>`;
  if (isNoncharacter(cp)) return `<${labels.noncharacter_tail}-${formatHex(cp)}>`;
  return null;
}
