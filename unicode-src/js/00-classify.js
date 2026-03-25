/* ================================================================
   UTILITY FUNCTIONS
================================================================ */
function cpToStr(cp) {
  if (cp > 0xFFFF) {
    var c = cp - 0x10000;
    return String.fromCharCode(0xD800 + (c >> 10), 0xDC00 + (c & 0x3FF));
  }
  return String.fromCharCode(cp);
}
function cpHex(cp) { return "U+" + hex4(cp); }

/* ================================================================
   NON-VISIBLE CHARACTER CLASSIFICATION
   Returns true for characters that produce no visible glyph.
================================================================ */
function isNonVisible(cp) {
  if (cp <= 0x001F)                              return true; // C0 controls
  if (cp >= 0x007F && cp <= 0x009F)             return true; // DEL + C1
  if (cp >= 0xD800 && cp <= 0xDFFF)             return true; // Surrogates
  if (cp === 0xFEFF)                             return true; // BOM
  if (cp >= 0xFFF9 && cp <= 0xFFFB)             return true; // Interlinear
  if (cp === 0xFFFE || cp === 0xFFFF)            return true; // Noncharacters
  if ((cp & 0xFFFF) === 0xFFFE || (cp & 0xFFFF) === 0xFFFF) return true;
  if (cp >= 0xFDD0 && cp <= 0xFDEF)             return true; // Noncharacters
  if (cp >= 0x200B && cp <= 0x200F)             return true; // ZW space/marks
  if (cp >= 0x202A && cp <= 0x202E)             return true; // Bidi overrides
  if (cp >= 0x2060 && cp <= 0x206F)             return true; // Format chars
  if (cp >= 0xFE00 && cp <= 0xFE0F)             return true; // VS 1-16
  if (cp >= 0xE0000 && cp <= 0xE01EF)           return true; // Tags+VS supp.
  if (cp >= 0xE000 && cp <= 0xF8FF)             return true; // PUA
  if (cp >= 0xDB80 && cp <= 0xDBFF)             return true; // High PU surr.
  if (cp >= 0xF0000)                            return true; // Planes 15-16
  return false;
}

/* ================================================================
   RESERVED / UNASSIGNED CODE POINT DETECTION
   Uses UNASSIGNED — a sorted array of [start, end] ranges generated
   at build time from UnicodeData.txt (Unicode 17.0). A code point is
   reserved if and only if it appears in one of these ranges.

   Binary search: O(log n) per lookup, negligible cost.
   UNASSIGNED is declared in data/unassigned.js (injected before this
   file by the build script).
================================================================ */
function isReserved(cp) {
  var lo = 0, hi = UNASSIGNED.length - 1;
  while (lo <= hi) {
    var mid = (lo + hi) >> 1;
    var r = UNASSIGNED[mid];
    /* Single-element entry [n] stored as length-1 array */
    var rStart = r[0], rEnd = r.length > 1 ? r[1] : r[0];
    if      (cp < rStart) hi = mid - 1;
    else if (cp > rEnd)   lo = mid + 1;
    else                  return true;
  }
  return false;
}
