/**
 * VIEW: the output pane. Reads Settings, builds the code point list through
 * PURE selection functions, lays out headings and lazy chunk placeholders
 * through the mode renderer (first paint does not wait for cells or
 * detection), then scans coverage in idle slices and fills in the block
 * headings and the status bar as it goes (PRF-01, CP2-01).
 */
import { codePointToString } from "./codepoint/codePointToString.js";
import { coverageText } from "./coverage/coverageText.js";
import type { CoverageSummary } from "./coverage/summarizeCoverage.js";
import { startCoverageScan } from "./fonts/coverageScanner.js";
import { makeElement } from "./makeElement.js";
import { createLazyMaterializer, type LazyMaterializer } from "./render/lazyMaterializer.js";
import { collectCodePoints, type CodePointItem } from "./selection/collectCodePoints.js";
import { countAssigned } from "./selection/countAssigned.js";
import { filterByQuery } from "./selection/filterByQuery.js";
import type { TableSortColumn } from "./selection/sortTableItems.js";
import type { Settings } from "./state/settings.js";
import { isNonVisible } from "./ucd/isNonVisible.js";
import type { Block } from "./ucd/listBlocks.js";
import { listBlocks } from "./ucd/listBlocks.js";
import { setCoverageNote } from "./renderBlockHeading.js";
import { renderGrid, type GridContext } from "./renderGrid.js";
import { renderGridName } from "./renderGridName.js";
import { renderPlain } from "./renderPlain.js";
import { renderTable } from "./renderTable.js";

export interface OutputElements { output: HTMLElement; statBlocks: HTMLElement; statChars: HTMLElement }
export interface OutputContext { nameOf(cp: number): string; aliasesOf(cp: number): readonly string[]; verified(cp: number, char: string): boolean; onSort(col: TableSortColumn): void }
export interface RenderHandle { items: readonly CodePointItem[]; lazy: LazyMaterializer | null; dispose(): void }

const emptyHandle: RenderHandle = { items: [], lazy: null, dispose: () => undefined };

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

function renderMode(el: OutputElements, settings: Settings, blocks: Block[], items: CodePointItem[], ctx: GridContext & OutputContext): void {
  if (settings.mode === "grid") renderGrid(el.output, blocks, items, false, ctx);
  else if (settings.mode === "grid-cp") renderGrid(el.output, blocks, items, true, ctx);
  else if (settings.mode === "grid-name") renderGridName(el.output, blocks, items, ctx);
  else if (settings.mode === "table") renderTable(el.output, blocks, items, { ...ctx, sort: settings.tableSort });
  else renderPlain(el.output, items);
}

function reportCoverage(el: OutputElements, characters: number, spans: Map<string, HTMLElement>, summary: CoverageSummary, done: boolean): void {
  for (const [block, span] of spans) setCoverageNote(span, summary.byBlock.get(block));
  el.statChars.textContent = coverageText(characters, summary) + (done ? "" : " \u00B7 checking glyphs\u2026");
}

function startScan(el: OutputElements, items: CodePointItem[], spans: Map<string, HTMLElement>, ctx: OutputContext): () => void {
  const characters = countAssigned(items);
  const scan = startCoverageScan(items, (cp) => ctx.verified(cp, codePointToString(cp)), isNonVisible, (summary, done) => reportCoverage(el, characters, spans, summary, done));
  return scan.cancel;
}

function reset(el: OutputElements, settings: Settings): void {
  el.output.replaceChildren();
  el.output.classList.toggle("grid-mode", settings.mode.startsWith("grid"));
  el.output.style.fontSize = `${settings.size}px`;
}

function renderEmpty(el: OutputElements, items: CodePointItem[] | null): RenderHandle {
  el.statChars.textContent = items ? plural(0, "character") : "";
  el.output.append(items ? placeholder("\u2205", "No characters with current settings.") : placeholder("\u2B1B", "Select one or more Unicode blocks from the sidebar."));
  return emptyHandle;
}

export function renderOutput(el: OutputElements, settings: Settings, ctx: OutputContext, previous: RenderHandle | null): RenderHandle {
  previous?.dispose();
  const blocks = selectedBlocks(settings);
  el.statBlocks.textContent = plural(blocks.length, "block") + " selected";
  reset(el, settings);
  if (blocks.length === 0) return renderEmpty(el, null);
  const items = filterByQuery(collectCodePoints(blocks, settings.nonVisible), settings.nameFilter, ctx.nameOf, ctx.aliasesOf);
  if (items.length === 0) return renderEmpty(el, items);
  const lazy = createLazyMaterializer(el.output.parentElement);
  const spans = new Map<string, HTMLElement>();
  const width = Math.max(200, el.output.clientWidth - 40);
  renderMode(el, settings, blocks, items, { ...ctx, lazy, spans, width, size: settings.size });
  if (settings.mode === "plain") { el.statChars.textContent = plural(countAssigned(items), "character"); return { items, lazy, dispose: () => lazy.disconnect() }; }
  el.statChars.textContent = `${plural(countAssigned(items), "character")} \u00B7 checking glyphs\u2026`;
  const cancel = startScan(el, items, spans, ctx);
  return { items, lazy, dispose: () => { cancel(); lazy.disconnect(); } };
}
