import type { Block } from "../ucd/listBlocks.js";
import { isNonVisible } from "../ucd/isNonVisible.js";
import { isReserved } from "../ucd/isReserved.js";

/**
 * Up to `count` visible assigned code points spread evenly across a block,
 * plus its first and last ones. The probe tests each candidate font against
 * these to decide which fonts can serve the block.
 */
export function sampleBlock(block: Block, count: number): number[] {
  const usable = (cp: number) => !(cp >= 0xd800 && cp <= 0xdfff) && !isReserved(cp) && !isNonVisible(cp);
  const picks = new Set<number>();
  const span = block.end - block.start + 1;
  for (let i = 0; i < count; i++) {
    for (let cp = block.start + Math.floor((i * span) / count); cp <= block.end; cp++) {
      if (usable(cp)) { picks.add(cp); break; }
    }
  }
  for (let cp = block.end; cp >= block.start; cp--) if (usable(cp)) { picks.add(cp); break; }
  return [...picks].sort((a, b) => a - b);
}
