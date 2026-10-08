/** VIEW: Grid+Name mode — glyph, code point, and name per cell, built lazily per chunk. */
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { appendLazyChunks, blockPlaceholder } from "./lazyChunks.js";
import { makeElement } from "./makeElement.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";
import { groupByBlock } from "./selection/groupByBlock.js";
import type { Block } from "./ucd/listBlocks.js";
import { displayForm } from "./ucd/displayForm.js";
import { makeBlockHeading } from "./renderBlockHeading.js";
import { cellAttributes, type GridContext } from "./renderGrid.js";

function reservedCell(item: CodePointItem): HTMLDivElement {
  const cp = formatCodePoint(item.cp);
  return makeElement("div", { class: "gcn cell-reserved", title: `${cp}  (reserved / unassigned)`, "aria-hidden": "true" }, [
    makeElement("span", { class: "cp", text: cp }),
    makeElement("span", { class: "cname", text: "(reserved)" }),
  ]);
}

function namedCell(item: CodePointItem, ctx: GridContext): HTMLDivElement {
  const form = displayForm(item.cp);
  const name = ctx.nameOf(item.cp);
  return makeElement("div", cellAttributes(item.cp, name, "gcn", ctx), [
    makeElement("span", { class: form.kind === "label" ? "glyph hidden-label" : "glyph", text: form.text }),
    makeElement("span", { class: "cp", text: formatCodePoint(item.cp) }),
    makeElement("span", { class: "cname", text: name }),
  ]);
}

function buildCells(items: readonly CodePointItem[], ctx: GridContext): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const item of items) fragment.append(item.reserved ? reservedCell(item) : namedCell(item, ctx));
  return fragment;
}

export function renderGridName(output: HTMLElement, blocks: readonly Block[], items: readonly CodePointItem[], ctx: GridContext): void {
  const byBlock = groupByBlock(items);
  const metrics = { width: 9 * ctx.size, height: 2.9 * ctx.size + 11, gap: 6 };
  for (const block of blocks) {
    const list = byBlock.get(block.name);
    if (!list?.length) continue;
    const grid = makeElement("div", { class: "char-grid-name", role: "group", "aria-label": block.name });
    output.append(makeBlockHeading(block, ctx.spans), grid);
    appendLazyChunks(grid, list, { lazy: ctx.lazy, width: ctx.width, metrics, placeholder: blockPlaceholder, build: (chunk) => buildCells(chunk, ctx) });
  }
}
