/** VIEW: mode radios, toggles, size slider, name filter, CJK locale. Each dispatches to the store. */
import cjkLocales from "../data/cjk-locales.json";
import { makeElement } from "./makeElement.js";
import type { SettingsStore } from "./settings/settingsStore.js";
import type { DisplayMode, Presentation, Settings } from "./state/settings.js";
import { setLang, setMode, setNameFilter, setNonVisible, setPlaceholders, setPresentation, setSize } from "./state/settingsActions.js";

export interface ControlElements {
  modes: HTMLInputElement[];
  nonVisible: HTMLInputElement;
  placeholders: HTMLInputElement;
  lang: HTMLSelectElement;
  presentation: HTMLSelectElement;
  slider: HTMLInputElement;
  sizeValue: HTMLElement;
  nameFilter: HTMLInputElement;
}

function wireNameFilter(input: HTMLInputElement, store: SettingsStore): void {
  let pending: ReturnType<typeof setTimeout> | null = null;
  input.addEventListener("input", () => {
    if (pending !== null) clearTimeout(pending);
    pending = setTimeout(() => store.dispatch(setNameFilter(input.value)), 150);
  });
}

export function buildLangOptions(select: HTMLSelectElement): void {
  for (const locale of cjkLocales.locales) select.append(makeElement("option", { value: locale.tag, text: locale.label }));
}

export function wireControls(el: ControlElements, store: SettingsStore): void {
  for (const r of el.modes) r.addEventListener("change", () => { if (r.checked) store.dispatch(setMode(r.value as DisplayMode)); });
  el.nonVisible.addEventListener("change", () => store.dispatch(setNonVisible(el.nonVisible.checked)));
  el.placeholders.addEventListener("change", () => store.dispatch(setPlaceholders(el.placeholders.checked)));
  el.lang.addEventListener("change", () => store.dispatch(setLang(el.lang.value)));
  el.presentation.addEventListener("change", () => store.dispatch(setPresentation(el.presentation.value as Presentation)));
  el.slider.addEventListener("input", () => store.dispatch(setSize(Number(el.slider.value))));
  wireNameFilter(el.nameFilter, store);
}

export function reflectControls(el: ControlElements, s: Settings): void {
  for (const r of el.modes) r.checked = r.value === s.mode;
  el.nonVisible.checked = s.nonVisible;
  el.placeholders.checked = s.placeholders;
  if (el.lang.value !== s.lang) el.lang.value = s.lang;
  if (el.presentation.value !== s.presentation) el.presentation.value = s.presentation;
  el.slider.value = String(s.size);
  el.sizeValue.textContent = `${s.size}px`;
  if (el.nameFilter.value !== s.nameFilter && document.activeElement !== el.nameFilter) el.nameFilter.value = s.nameFilter;
}
