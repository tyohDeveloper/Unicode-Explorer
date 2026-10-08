import { formatCodePoint } from "../codepoint/formatCodePoint.js";
import { algorithmicName } from "./algorithmicName.js";
import { categoryLabel } from "./categoryLabel.js";

/**
 * Character name resolution, in order: the decoded UnicodeData name table,
 * algorithmic names, category labels, then "U+XXXX" for anything unassigned.
 */
export function resolveCharName(table: ReadonlyMap<number, string>, cp: number): string {
  return table.get(cp) ?? algorithmicName(cp) ?? categoryLabel(cp) ?? formatCodePoint(cp);
}
