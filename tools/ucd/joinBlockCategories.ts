/**
 * Join the vendored block list with the authored category assignments. A block
 * without a category, or a category for a block that no longer exists, fails
 * the build: the sidebar must account for every block exactly once.
 */
import type { UcdBlock } from "./parseBlocks.js";

export interface CategorizedBlock { name: string; start: number; end: number; category: string }

export function joinBlockCategories(blocks: UcdBlock[], categories: Record<string, string>): CategorizedBlock[] {
  const unknown = Object.keys(categories).filter((name) => !blocks.some((b) => b.name === name));
  if (unknown.length) throw new Error(`block-categories.json names blocks that are not in Blocks.txt: ${unknown.join(", ")}`);
  return blocks.map((b) => {
    const category = categories[b.name];
    if (!category) throw new Error(`block-categories.json has no category for "${b.name}"`);
    return { name: b.name, start: b.start, end: b.end, category };
  });
}
