/** VIEW: Grid and Grid+CP modes. One cell per code point; reserved cells are inert placeholders. */
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { formatHex } from "./codepoint/formatHex.js";
import { makeElement } from "./makeElement.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";
import { groupByBlock } from "./selection/groupByBlock.js";
import type { Block } from "./ucd/listBlocks.js";
import { displayForm } from "./ucd/displayForm.js";
import { makeBlockHeading, type BlockCoverage } from "./renderBlockHeading.js";

export interface GridContext {
  nameOf(cp: number): string;
  insert(text: string): void;
  /** True when a listed font renders the character (Phase 4 detection). */
  verified(cp: number, char: string): boolean;
  coverage: ReadonlyMap<string, BlockCoverage>;
}

/** Class list for a glyph cell: display kind and detection result. */
export function glyphClasses(base: string, cp: number, ctx: GridContext): string {
  const form = displayForm(cp);
  if (form.kind === "label") return `${base} cell-hidden`;
  const classes = [base];
  if (form.kind === "mark") classes.push("cell-mark");
  if (!ctx.verified(cp, form.char)) classes.push("unverified");
  return classes.join(" ");
}

function reservedCell(item: CodePointItem, base: string): HTMLDivElement {
  return makeElement("div", { class: `${base} cell-reserved`, title: `${formatCodePoint(item.cp)}  (reserved / unassigned)` });
}

function glyphCell(item: CodePointItem, showCp: boolean, ctx: GridContext): HTMLDivElement {
  const form = displayForm(item.cp);
  const hex = formatHex(item.cp);
  const cell = makeElement("div", { class: glyphClasses(showCp ? "gcc" : "gc", item.cp, ctx), title: `${formatCodePoint(item.cp)}  ${ctx.nameOf(item.cp)} \u2014 click to insert`, "data-testid": `button-grid-cell-${hex}`, "data-cp": hex });
  const glyph = makeElement("span", { class: form.kind === "label" ? "glyph hidden-label" : "glyph", text: form.text });
  cell.append(glyph);
  if (showCp) cell.append(makeElement("span", { class: "cp", text: hex }));
  cell.addEventListener("click", () => ctx.insert(form.char));
  return cell;
}

export function renderGrid(output: HTMLElement, blocks: readonly Block[], items: readonly CodePointItem[], showCp: boolean, ctx: GridContext): void {
  const byBlock = groupByBlock(items);
  for (const block of blocks) {
    const list = byBlock.get(block.name);
    if (!list?.length) continue;
    output.append(makeBlockHeading(block, ctx.coverage.get(block.name)));
    const grid = makeElement("div", { class: showCp ? "char-grid-cp" : "char-grid" });
    for (const item of list) grid.append(item.reserved ? reservedCell(item, showCp ? "gcc" : "gc") : glyphCell(item, showCp, ctx));
    output.append(grid);
  }
}
