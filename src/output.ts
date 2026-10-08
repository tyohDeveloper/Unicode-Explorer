/**
 * VIEW: the output pane. Reads Settings, builds the code point list through
 * PURE selection functions, dispatches to the mode renderer, and updates the
 * status bar. Re-rendering is driven by store subscriptions in main.ts.
 */
import { makeElement } from "./makeElement.js";
import { collectCodePoints, type CodePointItem } from "./selection/collectCodePoints.js";
import { countAssigned } from "./selection/countAssigned.js";
import { filterByName } from "./selection/filterByName.js";
import type { TableSortColumn } from "./selection/sortTableItems.js";
import type { Settings } from "./state/settings.js";
import type { Block } from "./ucd/listBlocks.js";
import { listBlocks } from "./ucd/listBlocks.js";
import { renderGrid, type GridContext } from "./renderGrid.js";
import { renderGridName } from "./renderGridName.js";
import { renderPlain } from "./renderPlain.js";
import { renderTable } from "./renderTable.js";

export interface OutputElements { output: HTMLElement; statBlocks: HTMLElement; statChars: HTMLElement }
export interface OutputContext extends GridContext { onSort(col: TableSortColumn): void }

function placeholder(symbol: string, message: string): HTMLDivElement {
  return makeElement("div", { id: "placeholder" }, [makeElement("span", { class: "big", text: symbol }), makeElement("p", { text: message })]);
}

function selectedBlocks(settings: Settings): Block[] {
  const selected = new Set(settings.blocks);
  return listBlocks().filter((b) => selected.has(b.start));
}

function plural(n: number, word: string): string {
  return `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
}

function renderMode(el: OutputElements, settings: Settings, blocks: Block[], items: CodePointItem[], ctx: OutputContext): void {
  const table = { ...ctx, sort: settings.tableSort };
  if (settings.mode === "grid") renderGrid(el.output, blocks, items, false, ctx);
  else if (settings.mode === "grid-cp") renderGrid(el.output, blocks, items, true, ctx);
  else if (settings.mode === "grid-name") renderGridName(el.output, blocks, items, ctx);
  else if (settings.mode === "table") renderTable(el.output, blocks, items, table);
  else renderPlain(el.output, items);
}

export function renderOutput(el: OutputElements, settings: Settings, ctx: OutputContext): void {
  const blocks = selectedBlocks(settings);
  el.statBlocks.textContent = plural(blocks.length, "block") + " selected";
  el.output.replaceChildren();
  el.output.className = settings.mode.startsWith("grid") ? "grid-mode" : "";
  el.output.style.fontSize = `${settings.size}px`;
  if (blocks.length === 0) {
    el.statChars.textContent = "";
    el.output.append(placeholder("\u2B1B", "Select one or more Unicode blocks from the sidebar."));
    return;
  }
  const items = filterByName(collectCodePoints(blocks, settings.nonVisible), settings.nameFilter, ctx.nameOf);
  el.statChars.textContent = plural(countAssigned(items), "character");
  if (items.length === 0) {
    el.output.append(placeholder("\u2205", "No characters with current settings."));
    return;
  }
  renderMode(el, settings, blocks, items, ctx);
}
