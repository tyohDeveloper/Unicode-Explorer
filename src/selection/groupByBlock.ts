import type { CodePointItem } from "./collectCodePoints.js";

/** Items grouped by block name, preserving order. */
export function groupByBlock(items: readonly CodePointItem[]): Map<string, CodePointItem[]> {
  const groups = new Map<string, CodePointItem[]>();
  for (const item of items) {
    const list = groups.get(item.block);
    if (list) list.push(item);
    else groups.set(item.block, [item]);
  }
  return groups;
}
