/**
 * Fetch, pin, convert and measure every shipped font (fonts/manifest.json →
 * fonts/cache/). The one network step of the toolchain; nothing in `npm run
 * build` depends on it because the Standard fonts are vendored in fonts/standard/.
 *
 *   npm run fetch:fonts                      # all fonts
 *   npm run fetch:fonts -- --only jigmo2     # subset
 *   npm run fetch:fonts -- --update-vendored # rewrite fonts/standard/* from upstream
 *
 * Without --update-vendored a vendored file that differs from the fresh
 * conversion is an error (the vendored font must be reproducible from upstream).
 */
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFontManifest, writeFontManifest, type FontEntry } from "./fontManifest.js";
import { cacheFont } from "./cacheFont.js";
import { visibleAssignedSet } from "./visibleAssignedSet.js";
import { sha256Hex } from "./sha256Hex.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function checkVendored(font: FontEntry, woff2: Uint8Array, update: boolean): string {
  if (!font.vendored) return "";
  const path = resolve(repoRoot, font.vendored);
  const same = existsSync(path) && sha256Hex(new Uint8Array(readFileSync(path))) === sha256Hex(woff2);
  if (same) return " vendored ✓";
  if (!update) throw new Error(`${font.id}: ${font.vendored} differs from the upstream conversion; run with --update-vendored to replace it`);
  copyFileSync(resolve(repoRoot, "fonts/cache", `${font.id}.${font.vendored.split(".").pop()}`), path);
  return " vendored updated";
}

export async function fetchFonts(only: string[], updateVendored: boolean): Promise<void> {
  const manifest = readFontManifest(repoRoot);
  const visible = visibleAssignedSet(repoRoot);
  for (const font of manifest.fonts) {
    if (only.length && !only.includes(font.id)) continue;
    const woff2 = await cacheFont(repoRoot, font, visible);
    const note = checkVendored(font, woff2, updateVendored);
    console.log(`${font.id}: ${woff2.length} bytes, ${font.cmap_code_points} cmap, ${font.assigned_visible_cmap_count} visible assigned${note}`);
  }
  manifest.generated = new Date().toISOString().slice(0, 10);
  writeFontManifest(repoRoot, manifest);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : [];
  fetchFonts(only, args.includes("--update-vendored")).catch((e: Error) => { console.error(`fetch:fonts FAILED — ${e.message}`); process.exit(1); });
}
