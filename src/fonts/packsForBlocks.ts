export interface PackCatalogueEntry { id: string; label: string; file: string; bytes: number; families: string[]; blocks: string[]; kind?: "blocks" | "style"; styles?: string[]; faces?: "regular" | "styled" }

/** Packs whose blocks intersect the selected block starts (hex, as in the catalogue), in catalogue order. */
export function packsForBlocks<T extends PackCatalogueEntry>(packs: readonly T[], selectedStarts: readonly number[]): T[] {
  const selected = new Set(selectedStarts.map((cp) => cp.toString(16).toUpperCase().padStart(4, "0")));
  return packs.filter((pack) => pack.kind !== "style" && pack.blocks.some((hex) => selected.has(hex)));
}
