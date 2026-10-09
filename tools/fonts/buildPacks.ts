/**
 * Build the sidecar font packs and edition zips (ADR-0001, PLAN.md D-10):
 *   unicode-fonts/<pack>.js       one classic script per pack (base64 WOFF2)
 *   unicode-fonts/manifest.js     catalogue for one edition
 *   dist/release/unicode-explorer-<edition>-<app>.zip
 * Reads fonts/cache/ (run fetch:fonts first) and records each pack's blocks
 * and bytes plus each edition's measured coverage back into fonts/manifest.json.
 *
 *   npm run build:packs                       # every edition that has packs
 *   npm run build:packs -- --edition complete
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fontById, readFontManifest, writeFontManifest, type Edition, type FontManifest, type PackEntry } from "./fontManifest.js";
import { packBlocks, type BlockRange } from "./packBlocks.js";
import { packScript, packsManifestScript, type PackCatalogueEntry } from "./packScripts.js";
import { readCmap } from "./readCmap.js";
import { visibleAssignedSet } from "./visibleAssignedSet.js";
import { writeZip } from "./writeZip.js";
import { sourceSfnt } from "./sourceSfnt.js";
import { subsetSfnt } from "./subsetSfnt.js";
import { toUnicodeRange } from "./toUnicodeRange.js";
import { toWoff2 } from "./toWoff2.js";
import type { FontEntry } from "./fontManifest.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = resolve(repoRoot, "unicode-fonts");
const releaseDir = resolve(repoRoot, "dist/release");

interface Ctx { manifest: FontManifest; visible: Set<number>; blocks: BlockRange[]; app: string; unicode: string; cmaps: Map<string, Set<number>>; packCmaps: Map<string, Set<number>> }

/** D-20: hosts may refuse or redirect large files (the hosted test build redirects files over ~10 MB cross-origin, which CSP blocks), so no pack may exceed this. */
const MAX_PACK_BYTES = 8 * 1024 * 1024;

interface PackFont { font: FontEntry; bytes: Uint8Array; cmap: number[] }

async function packFont(ctx: Ctx, pack: PackEntry, font: FontEntry): Promise<PackFont> {
  if (!pack.subset) return { font, bytes: cachedWoff2(font.id), cmap: [...cmapOf(ctx, font.id)] };
  const bytes = await toWoff2(subsetSfnt(sourceSfnt(repoRoot, font), pack.subset));
  return { font, bytes, cmap: readCmap(bytes) };
}

function cachedWoff2(id: string): Uint8Array {
  const path = resolve(repoRoot, "fonts/cache", `${id}.woff2`);
  if (!existsSync(path)) throw new Error(`fonts/cache/${id}.woff2 is missing; run npm run fetch:fonts`);
  return new Uint8Array(readFileSync(path));
}

function cmapOf(ctx: Ctx, id: string): Set<number> {
  let cmap = ctx.cmaps.get(id);
  if (!cmap) { cmap = new Set(readCmap(cachedWoff2(id))); ctx.cmaps.set(id, cmap); }
  return cmap;
}

function unionCmap(ctx: Ctx, ids: readonly string[]): Set<number> {
  const union = new Set<number>();
  for (const id of ids) for (const cp of cmapOf(ctx, id)) union.add(cp);
  return union;
}

async function buildPack(ctx: Ctx, pack: PackEntry): Promise<PackCatalogueEntry> {
  const fonts = pack.fonts.map((id) => fontById(ctx.manifest, id));
  const parts = await Promise.all(fonts.map((f) => packFont(ctx, pack, f)));
  const script = packScript(pack.id, parts.map((p) => ({ family: p.font.css_family, format: "woff2" as const, bytes: p.bytes, weight: p.font.weight, style: p.font.style, range: pack.subset ? toUnicodeRange(p.cmap) : undefined })));
  if (Buffer.byteLength(script) > MAX_PACK_BYTES) throw new Error(`pack ${pack.id} is ${Buffer.byteLength(script)} bytes, over the ${MAX_PACK_BYTES}-byte limit (D-20); split it with "subset" ranges`);
  writeFileSync(resolve(outDir, `${pack.id}.js`), script);
  const cmap = new Set(parts.flatMap((p) => p.cmap));
  ctx.packCmaps.set(pack.id, cmap);
  if (pack.kind === "blocks" && pack.attach !== "planned") pack.blocks = packBlocks(ctx.blocks, pack.categories ?? [], cmap, ctx.visible);
  pack.bytes = Buffer.byteLength(script);
  const families = [...new Set(fonts.map((f) => f.css_family))];
  const meta = pack.kind === "style" ? { kind: "style" as const, styles: pack.styles, faces: pack.faces } : { kind: "blocks" as const };
  return { id: pack.id, label: pack.label, file: `${pack.id}.js`, bytes: pack.bytes, families, blocks: pack.blocks ?? [], ...meta, fonts: fonts.map((f) => ({ family: f.family, version: f.version, license: f.license, license_url: f.license_url })) };
}

/** Edition coverage from what actually ships: embedded fonts' full cmaps plus each pack's (possibly subset) cmap. */
function measureEdition(ctx: Ctx, edition: Edition): void {
  const packed = new Set(ctx.manifest.packs.flatMap((p) => p.fonts));
  const embedded = edition.fonts.filter((id) => fontById(ctx.manifest, id).role === "coverage" && !packed.has(id));
  const cmap = unionCmap(ctx, embedded);
  for (const id of edition.packs ?? []) for (const cp of ctx.packCmaps.get(id) ?? []) cmap.add(cp);
  edition.guaranteed_visible_code_points = [...ctx.visible].filter((cp) => cmap.has(cp)).length;
  edition.of = ctx.visible.size;
  edition.embedded_font_bytes = edition.fonts.reduce((sum, id) => sum + (fontById(ctx.manifest, id).woff2_bytes ?? 0), 0);
}

function zipEdition(ctx: Ctx, edition: Edition, entries: PackCatalogueEntry[]): string {
  const files: Record<string, Uint8Array> = { "Unicode.html": new Uint8Array(readFileSync(resolve(repoRoot, "Unicode.html"))) };
  const catalogue = { schema: "unicode-explorer-font-packs/1", app: ctx.app, unicode: ctx.unicode, edition: edition.id, packs: entries };
  files["unicode-fonts/manifest.js"] = Buffer.from(packsManifestScript(catalogue));
  for (const entry of entries) files[`unicode-fonts/${entry.file}`] = new Uint8Array(readFileSync(resolve(outDir, entry.file)));
  for (const pack of ctx.manifest.packs.filter((p) => entries.some((e) => e.id === p.id))) {
    for (const license of pack.license_files) files[`unicode-fonts/LICENSES/${license.split("/").pop()}`] = new Uint8Array(readFileSync(resolve(repoRoot, license)));
  }
  files["unicode-fonts/README.txt"] = Buffer.from(`Unicode Explorer ${ctx.app} — ${edition.id} edition font packs.\nKeep this folder next to Unicode.html; the app loads a pack when one of its blocks is selected.\nFont licenses are in LICENSES/. Application code is MIT (see the repository).\n`);
  const path = resolve(releaseDir, `unicode-explorer-${edition.id}-${ctx.app}.zip`);
  writeZip(path, files);
  return path;
}

export async function buildPacks(editionIds: string[]): Promise<void> {
  const manifest = readFontManifest(repoRoot);
  const { blocks } = JSON.parse(readFileSync(resolve(repoRoot, "src/data/blocks.json"), "utf-8")) as { blocks: [string, number, number, string][] };
  const { version: app } = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf-8")) as { version: string };
  const { unicode } = JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { unicode: string };
  const ctx: Ctx = { manifest, visible: visibleAssignedSet(repoRoot), blocks: blocks.map(([name, start, end, category]) => ({ name, start, end, category })), app, unicode, cmaps: new Map(), packCmaps: new Map() };
  mkdirSync(outDir, { recursive: true });
  mkdirSync(releaseDir, { recursive: true });
  const entries = new Map<string, PackCatalogueEntry>();
  for (const pack of manifest.packs) entries.set(pack.id, await buildPack(ctx, pack));
  // Development catalogue beside the packs: every pack, so the repo checkout behaves like the fullest edition.
  writeFileSync(resolve(outDir, "manifest.js"), packsManifestScript({ schema: "unicode-explorer-font-packs/1", app, unicode, edition: "development", packs: [...entries.values()] }));
  for (const edition of manifest.editions) {
    measureEdition(ctx, edition);
    if (!edition.packs?.length || !editionIds.includes(edition.id)) continue;
    const path = zipEdition(ctx, edition, edition.packs.map((id) => entries.get(id)!));
    console.log(`build:packs — ${edition.id}: ${edition.packs.length} packs, ${edition.guaranteed_visible_code_points}/${edition.of} visible assigned → ${path}`);
  }
  writeFontManifest(repoRoot, manifest);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const editions = args.includes("--edition") ? [args[args.indexOf("--edition") + 1]] : ["complete", "complete-hieroglyphs"];
  buildPacks(editions).catch((e: Error) => { console.error(`build:packs FAILED — ${e.message}`); process.exit(1); });
}
