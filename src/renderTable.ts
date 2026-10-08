/**
 * VIEW: Table mode. Default order is block-grouped with separator rows; a
 * user sort (Settings.tableSort) flattens the list. Rows are built lazily, one
 * <tbody> per chunk. Header clicks dispatch tableSort/toggle.
 */
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { formatHex } from "./codepoint/formatHex.js";
import { appendLazyChunks, type ChunkLayout } from "./lazyChunks.js";
import { makeElement } from "./makeElement.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";
import { groupByBlock } from "./selection/groupByBlock.js";
import type { TableSort, TableSortColumn } from "./selection/sortTableItems.js";
import { sortTableItems } from "./selection/sortTableItems.js";
import type { Block } from "./ucd/listBlocks.js";
import { displayForm } from "./ucd/displayForm.js";
import { blockHeadingText, coverageSpan } from "./renderBlockHeading.js";
import { glyphClasses, type GridContext } from "./renderGrid.js";

export interface TableContext extends GridContext { sort: TableSort | null; onSort(col: TableSortColumn): void }

/** "Ch" is not sortable: it orders exactly like Code Point (audit UX-02). */
const COLUMNS: { key: TableSortColumn | null; label: string }[] = [
  { key: "cp", label: "Code Point" }, { key: null, label: "Ch" }, { key: "name", label: "Name" }, { key: "block", label: "Block" },
];

function headerCell(col: { key: TableSortColumn | null; label: string }, ctx: TableContext): HTMLTableCellElement {
  if (!col.key) return makeElement("th", { text: col.label, scope: "col" });
  const key = col.key;
  const active = ctx.sort?.col === key;
  const indicator = makeElement("span", { class: "sort-indicator", text: active ? (ctx.sort?.dir === 1 ? " \u25B2" : " \u25BC") : "" });
  const button = makeElement("button", { type: "button", class: "th-sort", "data-testid": `button-table-sort-${key}`, text: col.label }, [indicator]);
  button.addEventListener("click", () => ctx.onSort(key));
  return makeElement("th", { class: active ? "sortable sort-active" : "sortable", scope: "col", "aria-sort": active ? (ctx.sort?.dir === 1 ? "ascending" : "descending") : "none" }, [button]);
}

function separatorBody(block: Block, ctx: TableContext): HTMLTableSectionElement {
  const span = coverageSpan();
  ctx.spans.set(block.name, span);
  return makeElement("tbody", {}, [makeElement("tr", { class: "block-sep" }, [makeElement("td", { colspan: "4", text: blockHeadingText(block) }, [span])])]);
}

function reservedRow(item: CodePointItem): HTMLTableRowElement {
  return makeElement("tr", { class: "tr-reserved" }, [
    makeElement("td", { class: "td-cp", text: formatCodePoint(item.cp) }),
    makeElement("td", { class: "td-ch" }),
    makeElement("td", { class: "td-name td-reserved-label", text: "(reserved / unassigned)" }),
    makeElement("td", { class: "td-block", text: item.block }),
  ]);
}

function charRow(item: CodePointItem, ctx: GridContext): HTMLTableRowElement {
  const form = displayForm(item.cp);
  const name = ctx.nameOf(item.cp);
  const hex = formatHex(item.cp);
  return makeElement("tr", { class: "tr-clickable", title: "Click or Enter to insert into the Composition Pad", "aria-label": `${formatCodePoint(item.cp)} ${name}`, tabindex: "-1", "data-cp": hex, "data-testid": `button-table-row-${hex}` }, [
    makeElement("td", { class: "td-cp", text: formatCodePoint(item.cp) }),
    makeElement("td", { class: glyphClasses("td-ch clickable", item.cp, ctx) }, [makeElement("span", { class: form.kind === "label" ? "glyph hidden-label" : "glyph", text: form.text })]),
    makeElement("td", { class: "td-name", text: name }),
    makeElement("td", { class: "td-block", text: item.block }),
  ]);
}

function rowsLayout(ctx: TableContext): ChunkLayout {
  return {
    lazy: ctx.lazy, width: 1, metrics: { width: 1, height: 1.2 * ctx.size + 10, gap: 0 },
    placeholder: (height) => makeElement("tbody", {}, [makeElement("tr", {}, [makeElement("td", { colspan: "4", style: `height:${height}px;padding:0` })])]),
    build: (items) => makeElement("tbody", {}, items.map((item) => (item.reserved ? reservedRow(item) : charRow(item, ctx)))),
  };
}

export function renderTable(output: HTMLElement, blocks: readonly Block[], items: readonly CodePointItem[], ctx: TableContext): void {
  const head = makeElement("thead", {}, [makeElement("tr", {}, COLUMNS.map((c) => headerCell(c, ctx)))]);
  const table = makeElement("table", { class: "char-table", "data-testid": "table-output-main" }, [head]);
  output.append(table);
  if (ctx.sort) { appendLazyChunks(table, sortTableItems(items, ctx.sort, ctx.nameOf), rowsLayout(ctx), false); return; }
  const byBlock = groupByBlock(items);
  for (const block of blocks) {
    const list = byBlock.get(block.name);
    if (!list?.length) continue;
    table.append(separatorBody(block, ctx));
    appendLazyChunks(table, list, rowsLayout(ctx));
  }
}
