/* ================================================================
   CHARACTER NAME RESOLUTION
   Strategy (in order):
   1. Named lookup table (CN) — injected by the build script from
      UnicodeData.txt; covers every individually-named code point
      (~25 K entries, Unicode 17.0).
   2. Algorithmic names — CJK, CJK Compat, Hangul, Tangut, Nushu,
      Khitan Small Script (per Unicode §4.8 / NamesList derivation).
      ALGO_RANGES and hangulName are defined in data/algo-ranges.js.
   3. Category labels — <control>, <surrogate>, <private-use>,
      <noncharacter>.
   4. Fallback: U+XXXX (unassigned/reserved code point).

   CN is declared as a plain object by the build script (see
   scripts/src/unicode/build.ts → serializeNameMap) immediately
   before this file is concatenated into Unicode.html.
================================================================ */

function getAlgoName(cp) {
  var i, r, h;
  for (i = 0; i < ALGO_RANGES.length; i++) {
    r = ALGO_RANGES[i];
    if (cp >= r[0] && cp <= r[1]) {
      h = cp.toString(16).toUpperCase();
      while (h.length < 4) h = "0" + h;
      return r[2] + h;
    }
  }
  if (cp >= 0xAC00 && cp <= 0xD7A3) return "HANGUL SYLLABLE " + hangulName(cp);
  return null;
}

function hex4(cp) { var h = cp.toString(16).toUpperCase(); while(h.length < 4) h = "0" + h; return h; }

function getCharName(cp) {
  var n = CN[cp];
  if (n) return n;
  n = getAlgoName(cp);
  if (n) return n;
  if (cp <= 0x001F)                         return "<control-" + hex4(cp) + ">";
  if (cp >= 0x007F && cp <= 0x009F)         return "<control-" + hex4(cp) + ">";
  if (cp >= 0xD800 && cp <= 0xDFFF)         return "<surrogate-" + hex4(cp) + ">";
  if (cp >= 0xE000 && cp <= 0xF8FF)         return "<private-use-" + hex4(cp) + ">";
  if (cp >= 0xF0000 && cp <= 0xFFFFF)       return "<private-use-" + hex4(cp) + ">";
  if (cp >= 0x100000 && cp <= 0x10FFFF)     return "<private-use-" + hex4(cp) + ">";
  if (cp >= 0xFDD0 && cp <= 0xFDEF)         return "<noncharacter-" + hex4(cp) + ">";
  if ((cp & 0xFFFF) === 0xFFFE || (cp & 0xFFFF) === 0xFFFF)
                                            return "<noncharacter-" + hex4(cp) + ">";
  return "U+" + hex4(cp);
}
