/**
 * VIEW: Table mode. Default order is block-grouped with separator rows; a
 * user sort (Settings.tableSort) flattens the list. Header clicks dispatch
 * tableSort/toggle; the re-render comes back through the store.
 */
import { codePointToString } from "./codepoint/codePointToString.js";
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { formatHex } from "./codepoint/formatHex.js";
import { makeElement } from "./makeElement.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";
import { groupByBlock } from "./selection/groupByBlock.js";
import type { TableSort, TableSortColumn } from "./selection/sortTableItems.js";
import { sortTableItems } from "./selection/sortTableItems.js";
import type { Block } from "./ucd/listBlocks.js";
import { blockHeadingText } from "./renderBlockHeading.js";
import type { GridContext } from "./renderGrid.js";

export interface TableContext extends GridContext { sort: TableSort | null; onSort(col: TableSortColumn): void }

const COLUMNS: { key: TableSortColumn; label: string }[] = [
  { key: "cp", label: "Code Point" }, { key: "ch", label: "Ch" }, { key: "name", label: "Name" }, { key: "block", label: "Block" },
];

function headerCell(col: { key: TableSortColumn; label: string }, ctx: TableContext): HTMLTableCellElement {
  const active = ctx.sort?.col === col.key;
  const indicator = makeElement("span", { class: "sort-indicator", text: active ? (ctx.sort?.dir === 1 ? " \u25B2" : " \u25BC") : "" });
  const th = makeElement("th", { class: active ? "sortable sort-active" : "sortable", "data-testid": `button-table-sort-${col.key}`, text: col.label }, [indicator]);
  th.addEventListener("click", () => ctx.onSort(col.key));
  return th;
}

function separatorRow(block: Block): HTMLTableRowElement {
  return makeElement("tr", { class: "block-sep" }, [makeElement("td", { colspan: "4", text: blockHeadingText(block) })]);
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
  const ch = codePointToString(item.cp);
  const row = makeElement("tr", { class: "tr-clickable", title: "Click to insert into Composition Pad", "data-testid": `button-table-row-${formatHex(item.cp)}` }, [
    makeElement("td", { class: "td-cp", text: formatCodePoint(item.cp) }),
    makeElement("td", { class: "td-ch clickable", text: ch }),
    makeElement("td", { class: "td-name", text: ctx.nameOf(item.cp) }),
    makeElement("td", { class: "td-block", text: item.block }),
  ]);
  row.addEventListener("click", () => ctx.insert(ch));
  return row;
}

function groupedBody(blocks: readonly Block[], items: readonly CodePointItem[], ctx: TableContext): HTMLTableSectionElement {
  const body = makeElement("tbody");
  const byBlock = groupByBlock(items);
  for (const block of blocks) {
    const list = byBlock.get(block.name);
    if (!list?.length) continue;
    body.append(separatorRow(block));
    for (const item of list) body.append(item.reserved ? reservedRow(item) : charRow(item, ctx));
  }
  return body;
}

function sortedBody(items: readonly CodePointItem[], sort: TableSort, ctx: TableContext): HTMLTableSectionElement {
  const body = makeElement("tbody");
  for (const item of sortTableItems(items, sort, ctx.nameOf)) body.append(item.reserved ? reservedRow(item) : charRow(item, ctx));
  return body;
}

export function renderTable(output: HTMLElement, blocks: readonly Block[], items: readonly CodePointItem[], ctx: TableContext): void {
  const head = makeElement("thead", {}, [makeElement("tr", {}, COLUMNS.map((c) => headerCell(c, ctx)))]);
  const body = ctx.sort ? sortedBody(items, ctx.sort, ctx) : groupedBody(blocks, items, ctx);
  output.append(makeElement("table", { class: "char-table", "data-testid": "table-output-main" }, [head, body]));
}
