import type { CodePointItem } from "./collectCodePoints.js";

export interface ItemChunk { block: string; items: CodePointItem[] }

/**
 * Split items into runs of at most `size` that never cross a block boundary.
 * The output pane materialises one chunk at a time as it nears the viewport.
 */
export function chunkItems(items: readonly CodePointItem[], size: number, byBlock = true): ItemChunk[] {
  const chunks: ItemChunk[] = [];
  let current: ItemChunk | null = null;
  for (const item of items) {
    if (!current || current.items.length >= size || (byBlock && current.block !== item.block)) {
      current = { block: item.block, items: [] };
      chunks.push(current);
    }
    current.items.push(item);
  }
  return chunks;
}
