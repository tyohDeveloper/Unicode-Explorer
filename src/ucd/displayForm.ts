import { codePointToString } from "../codepoint/codePointToString.js";
import { hiddenLabel } from "./hiddenLabel.js";
import { isCombiningMark } from "./isCombiningMark.js";

export interface DisplayForm {
  /** What the cell shows: the character, "◌" + mark, or a short label. */
  text: string;
  kind: "glyph" | "mark" | "label";
  /** What a click inserts and what the glyph probe measures: always the bare character. */
  char: string;
}

/** How a code point is drawn in grids and tables (Phase 4: marks on U+25CC, labelled boxes for non-visible characters). */
export function displayForm(cp: number): DisplayForm {
  const char = codePointToString(cp);
  const label = hiddenLabel(cp);
  if (label !== null) return { text: label, kind: "label", char };
  if (isCombiningMark(cp)) return { text: `\u25CC${char}`, kind: "mark", char };
  return { text: char, kind: "glyph", char };
}
