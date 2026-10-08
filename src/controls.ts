/** VIEW: mode radios, non-visible toggle, size slider, name filter. Each dispatches to the store. */
import type { SettingsStore } from "./settings/settingsStore.js";
import type { DisplayMode, Settings } from "./state/settings.js";
import { setMode, setNameFilter, setNonVisible, setSize } from "./state/settingsActions.js";

export interface ControlElements {
  modes: HTMLInputElement[];
  nonVisible: HTMLInputElement;
  slider: HTMLInputElement;
  sizeValue: HTMLElement;
  nameFilter: HTMLInputElement;
}

export function wireControls(el: ControlElements, store: SettingsStore): void {
  for (const r of el.modes) r.addEventListener("change", () => { if (r.checked) store.dispatch(setMode(r.value as DisplayMode)); });
  el.nonVisible.addEventListener("change", () => store.dispatch(setNonVisible(el.nonVisible.checked)));
  el.slider.addEventListener("input", () => store.dispatch(setSize(Number(el.slider.value))));
  let pending: ReturnType<typeof setTimeout> | null = null;
  el.nameFilter.addEventListener("input", () => {
    if (pending !== null) clearTimeout(pending);
    pending = setTimeout(() => store.dispatch(setNameFilter(el.nameFilter.value)), 150);
  });
}

export function reflectControls(el: ControlElements, s: Settings): void {
  for (const r of el.modes) r.checked = r.value === s.mode;
  el.nonVisible.checked = s.nonVisible;
  el.slider.value = String(s.size);
  el.sizeValue.textContent = `${s.size}px`;
  if (el.nameFilter.value !== s.nameFilter && document.activeElement !== el.nameFilter) el.nameFilter.value = s.nameFilter;
}
