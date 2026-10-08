import type { Block } from "../ucd/listBlocks.js";
import { isNonVisible } from "../ucd/isNonVisible.js";
import { isReserved } from "../ucd/isReserved.js";

export interface CodePointItem { cp: number; block: string; reserved: boolean }

/**
 * Every code point of the selected blocks, in block then code point order.
 * Surrogates are never included. Non-visible characters are excluded unless
 * requested. Reserved code points are included and flagged so grids can show a
 * placeholder cell.
 */
export function collectCodePoints(blocks: readonly Block[], includeNonVisible: boolean): CodePointItem[] {
  const items: CodePointItem[] = [];
  for (const block of blocks) {
    for (let cp = block.start; cp <= block.end; cp++) {
      if (cp >= 0xd800 && cp <= 0xdfff) continue;
      const reserved = isReserved(cp);
      if (!reserved && !includeNonVisible && isNonVisible(cp)) continue;
      items.push({ cp, block: block.name, reserved });
    }
  }
  return items;
}
