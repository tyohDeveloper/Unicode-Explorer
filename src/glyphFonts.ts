/**
 * VIEW: the output pane's font stack. Composes style stack + device fonts +
 * loaded packs + embedded coverage fonts (PLAN.md D-6), writes it to the
 * --glyph-font custom property, and hands the same stack to the glyph probe
 * so detection and display always agree. Waits for the embedded fonts before
 * the first probe, otherwise the canvas would measure a fallback.
 */
import deviceFonts from "../data/device-fonts.json";
import { composeFontStack } from "./fonts/composeFontStack.js";
import type { FontPackLoader } from "./fonts/fontPacks.js";
import type { GlyphProbe } from "./fonts/glyphProbe.js";
import { standardFonts } from "./fonts/standardFonts.js";
import { fontStackFor } from "./fontButtons.js";

export interface GlyphFonts { apply(fontId: string): void; ready: Promise<void> }

const device = Object.values(deviceFonts.families).flat();

export function createGlyphFonts(probe: GlyphProbe, packs: FontPackLoader): GlyphFonts {
  const standard = standardFonts();
  const toLoad = [...standard.coverage, standard.placeholder, standard.detection].filter(Boolean);
  const ready = Promise.all(toLoad.map((family) => document.fonts.load(`16px "${family}"`))).then(() => undefined, () => undefined);
  return {
    ready,
    apply(fontId: string): void {
      const stack = composeFontStack(fontStackFor(fontId), device, packs.families(), standard.coverage);
      document.documentElement.style.setProperty("--glyph-font", stack);
      document.documentElement.style.setProperty("--placeholder-font", `"${standard.placeholder}"`);
      probe.setStack(stack);
    },
  };
}
