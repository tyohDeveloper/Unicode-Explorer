/**
 * VIEW entry: wire the store, the sidebar, the controls, the output pane, and
 * the URL-hash effect. Start-up waits for the embedded name table to decode.
 */
import { wireComposePad } from "./composePad.js";
import { reflectControls, wireControls, type ControlElements } from "./controls.js";
import { wireCopyOutput } from "./copyOutput.js";
import { buildFontButtons, reflectFont } from "./fontButtons.js";
import { loadNameTable } from "./names/loadNameTable.js";
import { renderOutput, type OutputElements } from "./output.js";
import { createRenderScheduler } from "./render/scheduleRender.js";
import { createSettingsStore, type SettingsStore } from "./settings/settingsStore.js";
import type { TableSortColumn } from "./selection/sortTableItems.js";
import { buildSidebar, reflectSelection, type SidebarHandles } from "./sidebar.js";
import { wireSidebarSearch } from "./sidebarSearch.js";
import { decodeHashState } from "./state/decodeHashState.js";
import { encodeHashState } from "./state/encodeHashState.js";
import type { Settings } from "./state/settings.js";
import { hydrateSettings, toggleTableSort } from "./state/settingsActions.js";
import { resolveCharName } from "./ucd/resolveCharName.js";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
}

function controlElements(): ControlElements {
  return {
    modes: [...document.querySelectorAll<HTMLInputElement>("input[name=mode]")],
    nonVisible: byId("chk-nonvis"),
    slider: byId("font-size-slider"),
    sizeValue: byId("font-size-val"),
    nameFilter: byId("name-filter"),
  };
}

function syncHash(settings: Settings): void {
  const hash = encodeHashState(settings);
  const url = hash ? `#${hash}` : location.pathname + location.search;
  if (location.hash !== (hash ? `#${hash}` : "")) history.replaceState(null, "", url);
}

function wireHashNavigation(store: SettingsStore): void {
  window.addEventListener("hashchange", () => store.dispatch(hydrateSettings(decodeHashState(location.hash))));
}

function needsFullRender(next: Settings, previous: Settings): boolean {
  return next.blocks !== previous.blocks || next.mode !== previous.mode || next.nonVisible !== previous.nonVisible
    || next.nameFilter !== previous.nameFilter || next.tableSort !== previous.tableSort;
}

interface Views { sidebar: SidebarHandles; controls: ControlElements; fontRadios: HTMLInputElement[]; outputEl: OutputElements }

function buildViews(store: SettingsStore): Views {
  const outputEl: OutputElements = { output: byId("output"), statBlocks: byId("stat-blocks"), statChars: byId("stat-chars") };
  const controls = controlElements();
  const fontRadios = buildFontButtons(byId("font-btns"), store);
  const sidebar = buildSidebar(byId("block-list"), store);
  wireSidebarSearch(sidebar, store, byId("block-search"), byId("btn-all"), byId("btn-none"));
  wireControls(controls, store);
  wireCopyOutput(byId("btn-copy"), outputEl.output, outputEl.statChars, () => store.get().mode);
  return { sidebar, controls, fontRadios, outputEl };
}

function reflectAll(views: Views, settings: Settings): void {
  reflectSelection(views.sidebar, settings);
  reflectControls(views.controls, settings);
  reflectFont(views.fontRadios, settings.font);
}

async function start(): Promise<void> {
  const names = await loadNameTable();
  const store = createSettingsStore();
  const pad = wireComposePad(document);
  const ctx = { nameOf: (cp: number) => resolveCharName(names, cp), insert: (t: string) => pad.insert(t), onSort: (col: TableSortColumn) => store.dispatch(toggleTableSort(col)) };
  const views = buildViews(store);
  const render = createRenderScheduler(() => renderOutput(views.outputEl, store.get(), ctx));
  store.dispatch(hydrateSettings(decodeHashState(location.hash)));
  store.subscribe((next, previous) => {
    reflectAll(views, next);
    syncHash(next);
    if (needsFullRender(next, previous)) render();
    else if (next.size !== previous.size) views.outputEl.output.style.fontSize = `${next.size}px`;
  });
  wireHashNavigation(store);
  reflectAll(views, store.get());
  syncHash(store.get());
  renderOutput(views.outputEl, store.get(), ctx);
}

start().catch((err: unknown) => {
  const status = document.getElementById("stat-chars");
  if (status) status.textContent = `Failed to start: ${err instanceof Error ? err.message : String(err)}`;
  throw err;
});
