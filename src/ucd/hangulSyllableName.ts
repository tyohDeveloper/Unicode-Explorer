import jamo from "../../data/hangul-jamo.json";

const base = parseInt(jamo.base, 16);

/** "HANGUL SYLLABLE GA" for U+AC00, per The Unicode Standard §3.12; null outside the range. */
export function hangulSyllableName(cp: number): string | null {
  const index = cp - base;
  if (index < 0 || index >= jamo.count) return null;
  const lead = jamo.leads[Math.floor(index / (jamo.vowels.length * jamo.trails.length))];
  const vowel = jamo.vowels[Math.floor((index % (jamo.vowels.length * jamo.trails.length)) / jamo.trails.length)];
  const trail = jamo.trails[index % jamo.trails.length];
  return `HANGUL SYLLABLE ${lead}${vowel}${trail}`;
}
