import { listBlocks, type Block } from "./listBlocks.js";

/** The block containing a code point (binary search over the sorted block list), or null outside every block. */
export function blockOf(cp: number): Block | null {
  const blocks = listBlocks();
  let lo = 0;
  let hi = blocks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cp < blocks[mid].start) hi = mid - 1;
    else if (cp > blocks[mid].end) lo = mid + 1;
    else return blocks[mid];
  }
  return null;
}
