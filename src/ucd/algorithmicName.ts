import algorithmic from "../../data/algorithmic-names.json";
import { formatHex } from "../codepoint/formatHex.js";
import { parseHexRanges } from "../codepoint/parseHexRanges.js";
import { hangulSyllableName } from "./hangulSyllableName.js";

const ranges = parseHexRanges(algorithmic.ranges);

/** Names derived from the code point (CJK, Tangut, Nushu, Khitan, Hangul); null when not derivable. */
export function algorithmicName(cp: number): string | null {
  const range = ranges.find((r) => cp >= r.start && cp <= r.end);
  if (range) return range.prefix + formatHex(cp);
  return hangulSyllableName(cp);
}
