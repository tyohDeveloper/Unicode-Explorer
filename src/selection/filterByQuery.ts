import type { CodePointItem } from "./collectCodePoints.js";
import { parseQuery } from "./parseQuery.js";

/**
 * Search (audit DAT-04): case-insensitive substring of the character name or
 * any formal alias, or an exact code point / literal character. Reserved code
 * points never match.
 */
export function filterByQuery(items: readonly CodePointItem[], query: string, nameOf: (cp: number) => string, aliasesOf: (cp: number) => readonly string[]): CodePointItem[] {
  const q = parseQuery(query);
  if (!q.text && q.cp === null) return [...items];
  const textMatch = (cp: number) => !!q.text && (nameOf(cp).toLowerCase().includes(q.text) || aliasesOf(cp).some((a) => a.toLowerCase().includes(q.text)));
  return items.filter((item) => !item.reserved && (item.cp === q.cp || textMatch(item.cp)));
}
