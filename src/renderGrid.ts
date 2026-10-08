/** VIEW: Grid and Grid+CP modes. One cell per code point; reserved cells are inert placeholders. */
import { codePointToString } from "./codepoint/codePointToString.js";
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { formatHex } from "./codepoint/formatHex.js";
import { makeElement } from "./makeElement.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";
import { groupByBlock } from "./selection/groupByBlock.js";
import type { Block } from "./ucd/listBlocks.js";
import { makeBlockHeading } from "./renderBlockHeading.js";

export interface GridContext { nameOf(cp: number): string; insert(text: string): void }

function reservedCell(item: CodePointItem, base: string): HTMLDivElement {
  return makeElement("div", { class: `${base} cell-reserved`, title: `${formatCodePoint(item.cp)}  (reserved / unassigned)` });
}

function glyphCell(item: CodePointItem, showCp: boolean, ctx: GridContext): HTMLDivElement {
  const ch = codePointToString(item.cp);
  const hex = formatHex(item.cp);
  const cell = makeElement("div", { class: showCp ? "gcc" : "gc", title: `${formatCodePoint(item.cp)}  ${ctx.nameOf(item.cp)} \u2014 click to insert`, "data-testid": `button-grid-cell-${hex}`, "data-cp": hex });
  if (showCp) cell.append(makeElement("span", { class: "glyph", text: ch }), makeElement("span", { class: "cp", text: hex }));
  else cell.textContent = ch;
  cell.addEventListener("click", () => ctx.insert(ch));
  return cell;
}

export function renderGrid(output: HTMLElement, blocks: readonly Block[], items: readonly CodePointItem[], showCp: boolean, ctx: GridContext): void {
  const byBlock = groupByBlock(items);
  for (const block of blocks) {
    const list = byBlock.get(block.name);
    if (!list?.length) continue;
    output.append(makeBlockHeading(block));
    const grid = makeElement("div", { class: showCp ? "char-grid-cp" : "char-grid" });
    for (const item of list) grid.append(item.reserved ? reservedCell(item, showCp ? "gcc" : "gc") : glyphCell(item, showCp, ctx));
    output.append(grid);
  }
}
