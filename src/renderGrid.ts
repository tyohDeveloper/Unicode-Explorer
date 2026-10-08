/** VIEW: Grid and Grid+CP modes. One cell per code point, built lazily per chunk; reserved cells are inert placeholders. */
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { formatHex } from "./codepoint/formatHex.js";
import { appendLazyChunks, blockPlaceholder } from "./lazyChunks.js";
import { makeElement } from "./makeElement.js";
import type { LazyMaterializer } from "./render/lazyMaterializer.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";
import { groupByBlock } from "./selection/groupByBlock.js";
import type { Block } from "./ucd/listBlocks.js";
import { displayForm } from "./ucd/displayForm.js";
import { makeBlockHeading } from "./renderBlockHeading.js";

export interface GridContext {
  nameOf(cp: number): string;
  /** True when a listed font renders the character (Phase 4 detection). */
  verified(cp: number, char: string): boolean;
  lazy: LazyMaterializer;
  /** Block name → heading coverage span, filled by the background scan. */
  spans: Map<string, HTMLElement>;
  width: number;
  size: number;
}

/** Class list for a glyph cell: display kind and detection result. */
export function glyphClasses(base: string, cp: number, ctx: Pick<GridContext, "verified">): string {
  const form = displayForm(cp);
  if (form.kind === "label") return `${base} cell-hidden`;
  const classes = [base];
  if (form.kind === "mark") classes.push("cell-mark");
  if (!ctx.verified(cp, form.char)) classes.push("unverified");
  return classes.join(" ");
}

export function cellAttributes(cp: number, name: string, base: string, ctx: Pick<GridContext, "verified">): Record<string, string> {
  const hex = formatHex(cp);
  return { class: glyphClasses(base, cp, ctx), title: `${formatCodePoint(cp)}  ${name} \u2014 click or Enter to insert`, "aria-label": `${formatCodePoint(cp)} ${name}`, role: "button", tabindex: "-1", "data-testid": `button-grid-cell-${hex}`, "data-cp": hex };
}

function reservedCell(item: CodePointItem, base: string): HTMLDivElement {
  return makeElement("div", { class: `${base} cell-reserved`, title: `${formatCodePoint(item.cp)}  (reserved / unassigned)`, "aria-hidden": "true" });
}

function glyphCell(item: CodePointItem, showCp: boolean, ctx: GridContext): HTMLDivElement {
  const form = displayForm(item.cp);
  const cell = makeElement("div", cellAttributes(item.cp, ctx.nameOf(item.cp), showCp ? "gcc" : "gc", ctx));
  cell.append(makeElement("span", { class: form.kind === "label" ? "glyph hidden-label" : "glyph", text: form.text }));
  if (showCp) cell.append(makeElement("span", { class: "cp", text: formatHex(item.cp) }));
  return cell;
}

function buildCells(items: readonly CodePointItem[], showCp: boolean, ctx: GridContext): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const item of items) fragment.append(item.reserved ? reservedCell(item, showCp ? "gcc" : "gc") : glyphCell(item, showCp, ctx));
  return fragment;
}

export function renderGrid(output: HTMLElement, blocks: readonly Block[], items: readonly CodePointItem[], showCp: boolean, ctx: GridContext): void {
  const byBlock = groupByBlock(items);
  const metrics = showCp ? { width: 3.8 * ctx.size, height: 2.2 * ctx.size + 9, gap: 4 } : { width: 2 * ctx.size, height: 2 * ctx.size, gap: 2 };
  for (const block of blocks) {
    const list = byBlock.get(block.name);
    if (!list?.length) continue;
    const grid = makeElement("div", { class: showCp ? "char-grid-cp" : "char-grid", role: "group", "aria-label": block.name });
    output.append(makeBlockHeading(block, ctx.spans), grid);
    appendLazyChunks(grid, list, { lazy: ctx.lazy, width: ctx.width, metrics, placeholder: blockPlaceholder, build: (chunk) => buildCells(chunk, showCp, ctx) });
  }
}
