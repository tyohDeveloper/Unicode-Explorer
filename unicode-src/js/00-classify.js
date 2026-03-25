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
   A code point is "reserved" when it falls within a Unicode block
   range but has no assigned character — no name in CN, no
   algorithmic name, and is not a control/surrogate/PUA/noncharacter.

   Heuristic: getCharName falls back to "U+XXXX" only for these.
   NOTE: Script blocks not fully covered in CN (Arabic, Devanagari…)
   will also match this test. In Grid views they render as outlined
   placeholder cells; in Table and Plain they are omitted.
================================================================ */
function isReserved(cp) {
  // These categories have assigned purposes — not "reserved"
  if (cp <= 0x001F || (cp >= 0x007F && cp <= 0x009F)) return false; // controls
  if (cp >= 0xD800 && cp <= 0xDFFF)                   return false; // surrogates
  if (cp >= 0xE000 && cp <= 0xF8FF)                   return false; // PUA BMP
  if (cp >= 0xF0000)                                   return false; // PUA planes 15-16
  if (cp >= 0xFDD0 && cp <= 0xFDEF)                   return false; // noncharacters
  if ((cp & 0xFFFF) === 0xFFFE || (cp & 0xFFFF) === 0xFFFF) return false; // nonchars
  // Fallback "U+XXXX" from getCharName => unassigned/reserved
  var n = getCharName(cp);
  return n.length >= 2 && n.charAt(0) === "U" && n.charAt(1) === "+";
}
