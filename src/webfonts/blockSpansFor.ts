import { isInSortedRanges } from "../codepoint/isInSortedRanges.js";

export interface Span { start: number; end: number }

/** Selected block spans in which a family covers at least one selected character: its unicode-range in the emitted CSS. */
export function blockSpansFor(ranges: readonly (readonly number[])[], blocks: readonly Span[], cps: readonly number[]): Span[] {
  return blocks.filter((b) => cps.some((cp) => cp >= b.start && cp <= b.end && isInSortedRanges(cp, ranges)));
}
