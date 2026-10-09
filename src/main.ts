/**
 * VIEW entry: wire the store, the sidebar, the controls, the output pane, the
 * font stack and glyph probe, the sidecar font packs, the About dialog, and
 * the URL-hash effect. Start-up waits for the embedded name table to decode,
 * the embedded fonts to load, and the pack catalogue to load or fail.
 */
import { wireAbout } from "./about.js";
import { wireCssDialog } from "./cssDialog.js";
import { wireDetailsStrip, type DetailsSource } from "./detailsStrip.js";
import type { GlyphProbe } from "./fonts/glyphProbe.js";
import { wireComposePad } from "./composePad.js";
import { buildLangOptions, reflectControls, wireControls, type ControlElements } from "./controls.js";
import { wireCopyOutput } from "./copyOutput.js";
import { buildFontButtons, reflectFont } from "./fontButtons.js";
import { createFontPackLoader, type FontPackLoader } from "./fonts/fontPacks.js";
import { createGlyphProbe } from "./fonts/glyphProbe.js";
import { packStatusText } from "./fonts/packStatusText.js";
import { standardFonts } from "./fonts/standardFonts.js";
import { createGlyphFonts } from "./glyphFonts.js";
import { loadNameTable } from "./names/loadNameTable.js";
import { renderOutput, type OutputContext, type OutputElements, type RenderHandle } from "./output.js";
import { wireOutputEvents, wireSkipButton } from "./outputEvents.js";
import { plainText } from "./renderPlain.js";
import { createRenderScheduler } from "./render/scheduleRender.js";
import { createSettingsStore, type SettingsStore } from "./settings/settingsStore.js";
import type { TableSortColumn } from "./selection/sortTableItems.js";
import { buildSidebar, reflectSelection, type SidebarHandles } from "./sidebar.js";
import { wireSidebarSearch } from "./sidebarSearch.js";
import { decodeHashState } from "./state/decodeHashState.js";
import { encodeHashState } from "./state/encodeHashState.js";
import type { Settings } from "./state/settings.js";
import { hydrateSettings, toggleTableSort } from "./state/settingsActions.js";
import { aliasesOf } from "./ucd/aliasesOf.js";
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
    placeholders: byId("chk-placeholders"),
    lang: byId("cjk-lang"),
    presentation: byId("presentation"),
    bold: byId("chk-bold"),
    italic: byId("chk-italic"),
    noSynthesis: byId("chk-nosynth"),
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

function needsFullRender(next: Settings, previous: Settings): boolean {
  return next.blocks !== previous.blocks || next.mode !== previous.mode || next.nonVisible !== previous.nonVisible
    || next.nameFilter !== previous.nameFilter || next.tableSort !== previous.tableSort || next.font !== previous.font;
}

interface Views { sidebar: SidebarHandles; controls: ControlElements; fontRadios: HTMLInputElement[]; outputEl: OutputElements; statFonts: HTMLElement }

function buildViews(store: SettingsStore, packs: FontPackLoader, currentText: () => string): Views {
  const outputEl: OutputElements = { output: byId("output"), statBlocks: byId("stat-blocks"), statChars: byId("stat-chars") };
  const controls = controlElements();
  buildLangOptions(controls.lang);
  const fontRadios = buildFontButtons(byId("font-btns"), store);
  const sidebar = buildSidebar(byId("block-list"), store);
  wireSidebarSearch(sidebar, store, byId("block-search"), byId("btn-all"), byId("btn-none"));
  wireControls(controls, store);
  wireCopyOutput(byId("btn-copy"), outputEl.statChars, currentText);
  wireAbout(byId("btn-about"), byId<HTMLDialogElement>("about-dialog"), packs);
  return { sidebar, controls, fontRadios, outputEl, statFonts: byId("stat-fonts") };
}

function reflectAll(views: Views, settings: Settings): void {
  reflectSelection(views.sidebar, settings);
  reflectControls(views.controls, settings);
  reflectFont(views.fontRadios, settings.font);
  views.outputEl.output.classList.toggle("placeholders", settings.placeholders);
  views.outputEl.output.classList.toggle("emoji-text", settings.presentation === "text");
  views.outputEl.output.classList.toggle("emoji-color", settings.presentation === "emoji");
  views.outputEl.output.classList.toggle("text-bold", settings.bold);
  views.outputEl.output.classList.toggle("text-italic", settings.italic);
  views.outputEl.output.classList.toggle("no-synthesis", settings.noSynthesis);
  if (settings.lang) views.outputEl.output.setAttribute("lang", settings.lang); else views.outputEl.output.removeAttribute("lang");
}

/** A pack finished loading or failed: refresh the stack (new families), the status line, and the view. */
function onPacksChanged(views: Views, store: SettingsStore, fonts: { apply(id: string): void }, packs: FontPackLoader, render: () => void): void {
  views.statFonts.textContent = packStatusText(packs.statuses());
  fonts.apply(store.get().font);
  render();
}

function subscribe(store: SettingsStore, views: Views, fonts: { apply(id: string): void }, packs: FontPackLoader, render: () => void): void {
  store.subscribe((next, previous) => {
    reflectAll(views, next);
    syncHash(next);
    if (next.font !== previous.font) fonts.apply(next.font);
    if (next.font !== previous.font || next.bold !== previous.bold || next.italic !== previous.italic) packs.ensureForStyle(next.font, next.bold || next.italic);
    if (next.blocks !== previous.blocks) packs.ensureForBlocks(next.blocks);
    if (needsFullRender(next, previous)) render();
    else if (next.size !== previous.size) views.outputEl.output.style.fontSize = `${next.size}px`;
  });
  window.addEventListener("hashchange", () => store.dispatch(hydrateSettings(decodeHashState(location.hash))));
}

function wireExtras(store: SettingsStore, probe: GlyphProbe, current: () => RenderHandle | null): void {
  wireCssDialog(byId("btn-css"), { items: () => current()?.items ?? [], settings: () => store.get(), probe });
}

function wireOutput(output: HTMLElement, pad: { insert(t: string): void }, current: () => RenderHandle | null): void {
  wireOutputEvents(output, (t) => pad.insert(t), () => current()?.lazy ?? null);
  wireSkipButton(byId("btn-skip"), output);
}

/** D-22: name the drawing font — embedded (with its design), a loaded pack, or an installed font. */
function drawnByResolver(probe: GlyphProbe, packs: FontPackLoader): NonNullable<DetailsSource["drawnBy"]> {
  return (cp, text) => {
    const family = probe.drawnBy(cp, text);
    if (!family) return null;
    const embedded = standardFonts().all.find((f) => f.css_family === family);
    if (embedded) return { family: embedded.family, design: embedded.design ?? "outline", source: "embedded" };
    const packed = [...packs.families(), ...packs.styleFamilies("serif"), ...packs.styleFamilies("sans-serif")].includes(family);
    return packed ? { family: family.replace(/^UE (Outline )?/, ""), design: "outline", source: "pack" } : { family, design: "unknown", source: "installed" };
  };
}

function outputContext(names: ReadonlyMap<number, string>, probe: { verified(cp: number, ch: string): boolean }, store: SettingsStore): OutputContext {
  return { nameOf: (cp) => resolveCharName(names, cp), aliasesOf, verified: (cp, ch) => probe.verified(cp, ch), onSort: (col: TableSortColumn) => store.dispatch(toggleTableSort(col)) };
}

function firstPaint(settings: Settings, views: Views, fonts: { apply(id: string): void }, packs: FontPackLoader, draw: () => void): void {
  fonts.apply(settings.font);
  reflectAll(views, settings);
  syncHash(settings);
  packs.ensureForBlocks(settings.blocks);
  packs.ensureForStyle(settings.font, settings.bold || settings.italic);
  draw();
}

async function start(): Promise<void> {
  const names = await loadNameTable();
  const store = createSettingsStore();
  const pad = wireComposePad(document);
  const probe = createGlyphProbe(standardFonts().detection);
  let render = (): void => undefined;
  const packs = createFontPackLoader(() => onPacksChanged(views, store, fonts, packs, render));
  const fonts = createGlyphFonts(probe, packs);
  const ctx = outputContext(names, probe, store);
  let handle: RenderHandle | null = null;
  const views = buildViews(store, packs, () => plainText(handle?.items ?? []));
  const draw = () => { handle = renderOutput(views.outputEl, store.get(), ctx, handle); };
  wireOutput(views.outputEl.output, pad, () => handle);
  wireExtras(store, probe, () => handle);
  wireDetailsStrip(views.outputEl.output, byId("details"), { nameOf: ctx.nameOf, drawnBy: drawnByResolver(probe, packs) });
  render = createRenderScheduler(draw);
  store.dispatch(hydrateSettings(decodeHashState(location.hash)));
  subscribe(store, views, fonts, packs, render);
  await Promise.all([fonts.ready, packs.ready]);
  firstPaint(store.get(), views, fonts, packs, draw);
}

start().catch((err: unknown) => {
  const status = document.getElementById("stat-chars");
  if (status) status.textContent = `Failed to start: ${err instanceof Error ? err.message : String(err)}`;
  throw err;
});
