import jamo from "../../data/hangul-jamo.json";

const SBASE = parseInt(jamo.base, 16);
const LBASE = 0x1100, VBASE = 0x1161, TBASE = 0x11a7;

/** Canonical decomposition of a precomposed Hangul syllable into jamo (The Unicode Standard §3.12), or null. */
export function hangulDecomposition(cp: number): number[] | null {
  const s = cp - SBASE;
  if (s < 0 || s >= jamo.count) return null;
  const per = jamo.vowels.length * jamo.trails.length;
  const out = [LBASE + Math.floor(s / per), VBASE + Math.floor((s % per) / jamo.trails.length)];
  if (s % jamo.trails.length) out.push(TBASE + (s % jamo.trails.length));
  return out;
}
