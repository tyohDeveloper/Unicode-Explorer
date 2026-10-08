import type { PackCatalogueEntry } from "./packsForBlocks.js";

/** Style packs serving a font button id (D-14): regular faces always, bold/italic faces only when `styled`. */
export function packsForStyle<T extends PackCatalogueEntry>(packs: readonly T[], fontId: string, styled: boolean): T[] {
  return packs.filter((p) => p.kind === "style" && (p.styles ?? []).includes(fontId) && (p.faces !== "styled" || styled));
}
