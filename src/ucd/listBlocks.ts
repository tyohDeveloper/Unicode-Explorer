import blocksData from "../data/blocks.json";

export interface Block { name: string; start: number; end: number; category: string }

const blocks: readonly Block[] = blocksData.blocks.map(([name, start, end, category]) => ({
  name: String(name), start: Number(start), end: Number(end), category: String(category),
}));

/** Every Unicode block for the build's data version, in code point order, with its sidebar category. */
export function listBlocks(): readonly Block[] {
  return blocks;
}
