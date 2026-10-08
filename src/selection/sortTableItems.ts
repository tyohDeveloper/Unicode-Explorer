import type { CodePointItem } from "./collectCodePoints.js";

export type TableSortColumn = "cp" | "name" | "block";
export interface TableSort { col: TableSortColumn; dir: 1 | -1 }

function compareBy(sort: TableSort, nameOf: (cp: number) => string): (a: CodePointItem, b: CodePointItem) => number {
  if (sort.col === "name") return (a, b) => (nameOf(a.cp) < nameOf(b.cp) ? -1 : nameOf(a.cp) > nameOf(b.cp) ? 1 : 0);
  if (sort.col === "block") return (a, b) => (a.block < b.block ? -1 : a.block > b.block ? 1 : a.cp - b.cp);
  return (a, b) => a.cp - b.cp;
}

/** Stable sort by column (code-unit order for names, so the result is the same in every locale). */
export function sortTableItems(items: readonly CodePointItem[], sort: TableSort, nameOf: (cp: number) => string): CodePointItem[] {
  const compare = compareBy(sort, nameOf);
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (compare(a.item, b.item) || a.index - b.index) * sort.dir)
    .map((t) => t.item);
}
