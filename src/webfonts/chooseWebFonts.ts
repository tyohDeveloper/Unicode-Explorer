import { isInSortedRanges } from "../codepoint/isInSortedRanges.js";

export interface ChosenFont { family: string; gain: number }
export interface WebFontChoice { chosen: ChosenFont[]; covered: number; total: number }

type Ranges = Readonly<Record<string, readonly (readonly number[])[]>>;

/** One pass in priority order: keep each family that covers a selected character no earlier family covers. */
function orderedPass(order: readonly string[], ranges: Ranges, cps: readonly number[]): WebFontChoice {
  const covered = new Uint8Array(cps.length);
  const chosen: ChosenFont[] = [];
  let total = 0;
  for (const family of order) {
    const r = ranges[family];
    if (!r) continue;
    let gain = 0;
    for (let i = 0; i < cps.length; i++) if (!covered[i] && isInSortedRanges(cps[i], r)) { covered[i] = 1; gain++; }
    if (gain > 0) { chosen.push({ family, gain }); total += gain; }
  }
  return { chosen, covered: total, total: cps.length };
}

/** A large family is redundant when every selected character it covers is covered by another family still available. */
function redundant(family: string, available: readonly string[], ranges: Ranges, cps: readonly number[]): boolean {
  const own = ranges[family];
  const others = available.filter((f) => f !== family && ranges[f]).map((f) => ranges[f]);
  return cps.every((cp) => !isInSortedRanges(cp, own) || others.some((r) => isInSortedRanges(cp, r)));
}

/**
 * Walk a priority order (the Unicode Font Kit's serif or sans stack), keep
 * families that add coverage, then drop large families (≥ `large` bytes)
 * whose contribution other families in the order also cover, largest first,
 * and walk again without them, so a few CJK Extension B characters do not
 * pull in a 24 MB font. The order is quality-first, so the result is also the
 * font-family order to emit.
 */
export function chooseWebFonts(order: readonly string[], ranges: Ranges, cps: readonly number[], bytes: Readonly<Record<string, number>> = {}, large = 1_000_000): WebFontChoice {
  let available = [...order];
  const first = orderedPass(order, ranges, cps).chosen.map((c) => c.family);
  const candidates = first.filter((f) => (bytes[f] ?? 0) >= large).sort((a, b) => (bytes[b] ?? 0) - (bytes[a] ?? 0));
  for (const family of candidates) if (redundant(family, available, ranges, cps)) available = available.filter((f) => f !== family);
  return orderedPass(available, ranges, cps);
}
