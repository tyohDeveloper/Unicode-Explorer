export interface PackCatalogueEntry { id: string; label: string; file: string; bytes: number; families: string[]; blocks: string[] }

/** Packs whose blocks intersect the selected block starts (hex, as in the catalogue), in catalogue order. */
export function packsForBlocks<T extends PackCatalogueEntry>(packs: readonly T[], selectedStarts: readonly number[]): T[] {
  const selected = new Set(selectedStarts.map((cp) => cp.toString(16).toUpperCase().padStart(4, "0")));
  return packs.filter((pack) => pack.blocks.some((hex) => selected.has(hex)));
}
