/**
 * E2E fixtures under tmp/e2e/: the built artifact copied into
 *   standard/   alone (the Standard edition: no unicode-fonts/ beside it)
 *   packs/      with a unicode-fonts/ catalogue listing a real test pack built
 *               from the vendored Last Resort font (attached to Tangut Components
 *               Supplement, which no device or embedded font covers) and a
 *               listed-but-absent pack (attached to Anatolian Hieroglyphs).
 * Built with the same generator functions as the release packs.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { packScript, packsManifestScript } from "../../tools/fonts/packScripts.js";

export const repoRoot = resolve(import.meta.dirname, "../..");
const fixtureRoot = resolve(repoRoot, "tmp/e2e");

export const TEST_PACK_BLOCK = "18D80";
export const GHOST_PACK_BLOCK = "14400";

export function artifactUrl(fixture: "standard" | "packs"): string {
  return pathToFileURL(resolve(fixtureRoot, fixture, "Unicode.html")).href;
}

export function prepareFixtures(): void {
  for (const fixture of ["standard", "packs"]) {
    mkdirSync(resolve(fixtureRoot, fixture, "unicode-fonts"), { recursive: true });
    copyFileSync(resolve(repoRoot, "Unicode.html"), resolve(fixtureRoot, fixture, "Unicode.html"));
  }
  const lastResort = new Uint8Array(readFileSync(resolve(repoRoot, "fonts/standard/LastResort-Regular.woff2")));
  const dir = resolve(fixtureRoot, "packs/unicode-fonts");
  writeFileSync(resolve(dir, "test-pack.js"), packScript("test-pack", [{ family: "UE TestPack", format: "woff2", bytes: lastResort }]));
  writeFileSync(resolve(dir, "test-serif.js"), packScript("test-serif", [{ family: "UE TestSerif", format: "woff2", bytes: lastResort, weight: 400, style: "normal" }]));
  writeFileSync(resolve(dir, "test-serif-styles.js"), packScript("test-serif-styles", [{ family: "UE TestSerif", format: "woff2", bytes: lastResort, weight: 700, style: "normal" }]));
  writeFileSync(resolve(dir, "manifest.js"), packsManifestScript({
    schema: "unicode-explorer-font-packs/1", app: "test", unicode: "18.0.0", edition: "e2e",
    packs: [
      { id: "test-pack", label: "Test", file: "test-pack.js", bytes: lastResort.length, families: ["UE TestPack"], blocks: [TEST_PACK_BLOCK], fonts: [] },
      { id: "ghost", label: "Ghost", file: "ghost.js", bytes: 1, families: ["UE Ghost"], blocks: [GHOST_PACK_BLOCK], fonts: [] },
      { id: "test-serif", label: "Test serif", file: "test-serif.js", bytes: lastResort.length, families: ["UE TestSerif"], blocks: [], kind: "style", styles: ["serif"], faces: "regular", fonts: [] },
      { id: "test-serif-styles", label: "Test serif bold", file: "test-serif-styles.js", bytes: lastResort.length, families: ["UE TestSerif"], blocks: [], kind: "style", styles: ["serif"], faces: "styled", fonts: [] },
    ],
  }));
}
