/* ================================================================
   CHARACTER NAME RESOLUTION
   Strategy (in order):
   1. Named lookup table (CN) — injected by the build script from
      UnicodeData.txt; covers every individually-named code point
      (~25 K entries, Unicode 17.0).
   2. Algorithmic names — CJK, CJK Compat, Hangul, Tangut, Nushu,
      Khitan Small Script (per Unicode §4.8 / NamesList derivation).
   3. Category labels — <control>, <surrogate>, <private-use>,
      <noncharacter>.
   4. Fallback: U+XXXX (unassigned/reserved code point).

   CN is declared as a plain object by the build script (see
   scripts/src/unicode/build.ts → serializeNameMap) immediately
   before this file is concatenated into Unicode.html.
================================================================ */
var ALGO_RANGES = [
  [0x3400,  0x4DBF,  "CJK UNIFIED IDEOGRAPH-"],
  [0x4E00,  0x9FFF,  "CJK UNIFIED IDEOGRAPH-"],
  [0x20000, 0x2A6DF, "CJK UNIFIED IDEOGRAPH-"],
  [0x2A700, 0x2B73F, "CJK UNIFIED IDEOGRAPH-"],
  [0x2B740, 0x2B81F, "CJK UNIFIED IDEOGRAPH-"],
  [0x2B820, 0x2CEAF, "CJK UNIFIED IDEOGRAPH-"],
  [0x2CEB0, 0x2EBEF, "CJK UNIFIED IDEOGRAPH-"],
  [0x30000, 0x3134F, "CJK UNIFIED IDEOGRAPH-"],
  [0x31350, 0x323AF, "CJK UNIFIED IDEOGRAPH-"],
  [0x323B0, 0x3347F, "CJK UNIFIED IDEOGRAPH-"],
  [0x2EBF0, 0x2EE5F, "CJK UNIFIED IDEOGRAPH-"],
  [0xF900,  0xFAFF,  "CJK COMPATIBILITY IDEOGRAPH-"],
  [0x2F800, 0x2FA1F, "CJK COMPATIBILITY IDEOGRAPH-"],
  [0x17000, 0x187FF, "TANGUT IDEOGRAPH-"],
  [0x18D00, 0x18D7F, "TANGUT IDEOGRAPH-"],
  [0x1B170, 0x1B2FF, "NUSHU CHARACTER-"],
  [0x18B00, 0x18CFF, "KHITAN SMALL SCRIPT CHARACTER-"]
];

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

function hangulName(cp) {
  var L = ["G","GG","N","D","DD","R","M","B","BB","S","SS","","J","JJ","C","K","T","P","H"];
  var V = ["A","AE","YA","YAE","EO","E","YEO","YE","O","WA","WAE","OE","YO","U","WEO","WE","WI","YU","EU","YI","I"];
  var T = ["","G","GG","GS","N","NJ","NH","D","L","LG","LM","LB","LS","LT","LP","LH","M","B","BS","S","SS","NG","J","C","K","T","P","H"];
  var si = cp - 0xAC00;
  return L[Math.floor(si / (21*28))] + V[Math.floor((si % (21*28)) / 28)] + T[si % 28];
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
