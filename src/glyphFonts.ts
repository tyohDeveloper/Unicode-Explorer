/**
 * VIEW: the output pane's font stack. Composes style packs + device style
 * stack + device script fonts + block packs + embedded coverage fonts (PLAN.md
 * D-6, D-14), keeping only families present on this device (CP2-01: every
 * absent name made each probe measurement slower), writes it to --glyph-font,
 * and hands the same stack to the glyph probe so detection and display agree.
 * Waits for the embedded fonts before the first probe.
 */
import deviceFonts from "../data/device-fonts.json";
import { composeFontStack } from "./fonts/composeFontStack.js";
import type { FontPackLoader } from "./fonts/fontPacks.js";
import type { GlyphProbe } from "./fonts/glyphProbe.js";
import { isGenericFamily } from "./fonts/isGenericFamily.js";
import { splitFontFamilies } from "./fonts/splitFontFamilies.js";
import { standardFonts } from "./fonts/standardFonts.js";
import { fontStackFor } from "./fontButtons.js";

export interface GlyphFonts { apply(fontId: string): void; ready: Promise<void>; stack(): string; presentDevice(): string[] }

const device = Object.values(deviceFonts.families).flat();

/** D-28: embedded outline fonts (Charis Latin) precede the block packs; bitmap ones stay last. */
function embeddedByDesign(standard: ReturnType<typeof standardFonts>): { outline: string[]; bitmap: string[] } {
  const outline = standard.all.filter((f) => f.role === "coverage" && f.design !== "bitmap").map((f) => f.css_family);
  return { outline, bitmap: standard.coverage.filter((f) => !outline.includes(f)) };
}

export function createGlyphFonts(probe: GlyphProbe, packs: FontPackLoader): GlyphFonts {
  const standard = standardFonts();
  const toLoad = [...standard.coverage, standard.placeholder, standard.detection].filter(Boolean);
  // Load every embedded face directly: fonts.load() tests U+0020 by default and skips faces whose
  // unicode-range excludes it (the Latin Extended-G subset), which detection would then miss.
  const faces = [...document.fonts].filter((f) => toLoad.includes(f.family.replace(/^["']|["']$/g, "")));
  const ready = Promise.all([...toLoad.map((family) => document.fonts.load(`16px "${family}"`)), ...faces.map((f) => f.load())]).then(() => undefined, () => undefined);
  const present = (names: readonly string[]) => names.filter((n) => isGenericFamily(n) || probe.familyPresent(n));
  const { outline, bitmap } = embeddedByDesign(standard);
  let current = "";
  return {
    ready,
    stack: () => current,
    presentDevice: () => present(device),
    apply(fontId: string): void {
      current = composeFontStack({ stylePacks: packs.styleFamilies(fontId), style: present(splitFontFamilies(fontStackFor(fontId))), device: present(device), embeddedOutline: outline, blockPacks: packs.families(), embedded: bitmap });
      document.documentElement.style.setProperty("--glyph-font", current);
      document.documentElement.style.setProperty("--placeholder-font", `"${standard.placeholder}"`);
      probe.setStack(splitFontFamilies(current), standard.coverage);
    },
  };
}
