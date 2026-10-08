/**
 * VIEW: append a list of items to a container as lazily materialised chunks
 * (PRF-01). Each chunk starts as a sized placeholder; when it nears the
 * viewport the materializer swaps in the real cells. Placeholders carry
 * class "chunk-pending" so keyboard navigation can force them early.
 */
import type { LazyMaterializer } from "./render/lazyMaterializer.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";
import { chunkItems } from "./selection/chunkItems.js";
import { estimateChunkHeight, type CellMetrics } from "./selection/estimateChunkHeight.js";

export const CHUNK_SIZE = 512;

export interface ChunkLayout {
  lazy: LazyMaterializer;
  width: number;
  metrics: CellMetrics;
  placeholder(height: number): HTMLElement;
  build(items: readonly CodePointItem[]): Node;
}

export function appendLazyChunks(container: Element, items: readonly CodePointItem[], layout: ChunkLayout, byBlock = true): void {
  for (const chunk of chunkItems(items, CHUNK_SIZE, byBlock)) {
    const placeholder = layout.placeholder(estimateChunkHeight(chunk.items.length, layout.width, layout.metrics));
    placeholder.classList.add("chunk-pending");
    container.append(placeholder);
    layout.lazy.observe(placeholder, () => placeholder.replaceWith(layout.build(chunk.items)));
  }
}

export function blockPlaceholder(height: number): HTMLElement {
  const el = document.createElement("div");
  el.style.height = `${height}px`;
  el.style.width = "100%";
  return el;
}
