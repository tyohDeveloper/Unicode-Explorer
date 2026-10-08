/**
 * Which blocks a font pack serves (fonts/manifest.json pack_rule): blocks in
 * the pack's declared categories whose visible assigned code points the pack's
 * fonts map at least a quarter of. Coverage, not novelty: an installed outline
 * font is preferred over the embedded bitmap fonts wherever it applies, while
 * the category scope keeps a CJK pack's stray ASCII glyphs from attaching it
 * to Basic Latin.
 */
export interface BlockRange { name: string; start: number; end: number; category: string }

export function packBlocks(blocks: readonly BlockRange[], categories: readonly string[], packCmap: ReadonlySet<number>, visible: ReadonlySet<number>): string[] {
  const hex = (cp: number) => cp.toString(16).toUpperCase().padStart(4, "0");
  const chosen: string[] = [];
  for (const block of blocks) {
    if (!categories.includes(block.category)) continue;
    let total = 0, covered = 0;
    for (let cp = block.start; cp <= block.end; cp++) {
      if (!visible.has(cp)) continue;
      total++;
      if (packCmap.has(cp)) covered++;
    }
    if (covered > 0 && covered * 4 >= total) chosen.push(hex(block.start));
  }
  return chosen;
}
