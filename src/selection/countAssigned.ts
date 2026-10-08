import type { CodePointItem } from "./collectCodePoints.js";

/** Number of items that are assigned characters (not reserved placeholders). */
export function countAssigned(items: readonly CodePointItem[]): number {
  return items.reduce((n, item) => n + (item.reserved ? 0 : 1), 0);
}
