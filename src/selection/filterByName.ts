import type { CodePointItem } from "./collectCodePoints.js";

/** Case-insensitive substring match on the character name; reserved code points never match. */
export function filterByName(items: readonly CodePointItem[], query: string, nameOf: (cp: number) => string): CodePointItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  return items.filter((item) => !item.reserved && nameOf(item.cp).toLowerCase().includes(q));
}
