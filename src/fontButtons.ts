/** VIEW: glyph font selector radios generated from data/font-stacks.json. */
import fontStacks from "../data/font-stacks.json";
import { makeElement } from "./makeElement.js";
import type { SettingsStore } from "./settings/settingsStore.js";
import { setFont } from "./state/settingsActions.js";

export function fontStackFor(id: string): string {
  return fontStacks.fonts.find((f) => f.id === id)?.stack ?? fontStacks.fonts[0].stack;
}

export function applyGlyphFont(id: string): void {
  document.documentElement.style.setProperty("--glyph-font", fontStackFor(id));
}

export function buildFontButtons(container: HTMLElement, store: SettingsStore): HTMLInputElement[] {
  const radios = fontStacks.fonts.map((f) => {
    const radio = makeElement("input", { type: "radio", name: "gfont", value: f.id, "data-testid": `radio-font-${f.id}` });
    radio.addEventListener("change", () => { if (radio.checked) store.dispatch(setFont(f.id)); });
    container.append(makeElement("label", { title: f.title }, [radio, f.label]));
    return radio;
  });
  return radios;
}

export function reflectFont(radios: HTMLInputElement[], id: string): void {
  for (const r of radios) r.checked = r.value === id;
  applyGlyphFont(id);
}
