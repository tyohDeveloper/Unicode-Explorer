/**
 * Write data/web-fonts.json for the "CSS for this selection" dialog (PLAN Q-13):
 * public, pinned, CORS-verified font URLs another programmer can use, with each
 * regular face's coverage of visible assigned characters as compact ranges, and
 * the Unicode Font Kit's serif and sans priority orders. Measured data, written
 * by this tool and committed (like fonts/manifest.json); needs the kit checkout
 * for cmaps and fonts/cache/ for this repository's block fonts.
 *
 *   npx tsx tools/fonts/buildWebFontTable.ts /path/to/unicode-font-kit
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, strToU8 } from "fflate";
import { readFontManifest } from "./fontManifest.js";
import { readCmap } from "./readCmap.js";
import { visibleAssignedSet } from "./visibleAssignedSet.js";
import { downloadBytes } from "./downloadBytes.js";
import { sha256Hex } from "./sha256Hex.js";
import * as fontkit from "fontkit";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

interface KitRemote { family: string; face: string; weight: number; style: string; url: string; bytes: number; sha256: string; internal_family: string; format: string; version: string }
interface KitLocal { family: string; face: string; file: string }
export interface WebFont { family: string; face: string; weight: number; style: string; url: string; format: string; bytes: number; sha256: string; license: string; license_url: string; version: string }

const LICENSES: [RegExp, string, string][] = [
  [/^(Charis|Andika|Doulos)/, "OFL-1.1", "https://openfontlicense.org/"],
  [/^Noto/, "OFL-1.1", "https://openfontlicense.org/"],
  [/^DejaVu/, "Bitstream-Vera (DejaVu changes public domain)", "https://dejavu-fonts.github.io/License.html"],
  [/^Free/, "GPL-3.0-or-later WITH Font-exception-2.0", "https://www.gnu.org/software/freefont/license.html"],
  [/^Jigmo/, "CC0-1.0", "https://kamichikoichi.github.io/jigmo/"],
  [/^Unifont/, "OFL-1.1 OR GPL-2.0-or-later WITH Font-exception-2.0", "https://github.com/stgiga/UnifontEX"],
  [/^UniHieroglyphica/, "OFL-1.1", "https://github.com/thesaurus-linguae-aegyptiae/UniHieroglyphica"],
];

function license(family: string): [string, string] {
  const hit = LICENSES.find(([re]) => re.test(family));
  if (!hit) throw new Error(`no licence mapping for ${family}`);
  return [hit[1], hit[2]];
}

function compactRanges(cps: readonly number[]): number[][] {
  const out: number[][] = [];
  for (const cp of cps) {
    const last = out[out.length - 1];
    if (last && last[last.length - 1] === cp - 1) { if (last.length === 1) last.push(cp); else last[1] = cp; }
    else out.push([cp]);
  }
  return out;
}

async function unifontExCmap(r: KitRemote): Promise<number[]> {
  const path = resolve(repoRoot, "fonts/cache/web-unifontex.woff2");
  const bytes = existsSync(path) ? new Uint8Array(readFileSync(path)) : await downloadBytes(r.url);
  if (sha256Hex(bytes) !== r.sha256) throw new Error(`UnifontEX sha256 mismatch`);
  writeFileSync(path, bytes);
  return readCmap(bytes);
}

function kitEntries(kitDir: string): { remote: KitRemote[]; local: Map<string, string> } {
  const remote = (JSON.parse(readFileSync(resolve(kitDir, "internet/remote-font-manifest.json"), "utf-8")) as { fonts: KitRemote[] }).fonts;
  const local = new Map((JSON.parse(readFileSync(resolve(kitDir, "font-manifest.json"), "utf-8")) as { fonts: KitLocal[] }).fonts.map((f) => [`${f.family}|${f.face}`, resolve(kitDir, f.file)]));
  return { remote, local };
}

function toWebFont(r: KitRemote, family: string): WebFont {
  const [lic, url] = license(family);
  return { family, face: r.face, weight: r.weight, style: r.style, url: r.url, format: r.format, bytes: r.bytes, sha256: r.sha256, license: lic, license_url: url, version: r.version };
}

const kitName = (r: KitRemote) => (r.family === "UK UnifontEX" ? "UnifontEX" : r.internal_family);

async function kitFonts(kitDir: string, visible: Set<number>): Promise<{ fonts: WebFont[]; ranges: Record<string, number[][]>; names: Map<string, string> }> {
  const { remote, local } = kitEntries(kitDir);
  const fonts: WebFont[] = [];
  const ranges: Record<string, number[][]> = {};
  const names = new Map<string, string>();
  for (const r of remote) {
    const family = kitName(r);
    names.set(r.family, family);
    fonts.push(toWebFont(r, family));
    if (r.face !== "Regular") continue;
    const file = local.get(`${r.family}|Regular`);
    const cmap = r.family === "UK UnifontEX" ? await unifontExCmap(r) : readCmap(new Uint8Array(readFileSync(file!)));
    ranges[family] = compactRanges(cmap.filter((cp) => visible.has(cp)));
  }
  return { fonts, ranges, names };
}

function blockFonts(visible: Set<number>): { fonts: WebFont[]; ranges: Record<string, number[][]> } {
  const manifest = readFontManifest(repoRoot);
  const ids = ["NotoSansCuneiform", "NotoSansAnatolianHieroglyphs", "NotoSansBamum", "NotoSerifTangut", "unihieroglyphica"];
  const fonts: WebFont[] = [];
  const ranges: Record<string, number[][]> = {};
  for (const font of ids.map((id) => manifest.fonts.find((f) => f.id === id)!)) {
    const [lic, url] = license(font.family);
    fonts.push({ family: font.family, face: "Regular", weight: 400, style: "normal", url: font.source.url, format: "truetype", bytes: font.source.bytes ?? 0, sha256: font.source.sha256 ?? "", license: lic, license_url: url, version: font.version });
    ranges[font.family] = compactRanges(readCmap(new Uint8Array(readFileSync(resolve(repoRoot, "fonts/cache", `${font.id}.woff2`)))).filter((cp) => visible.has(cp)));
  }
  return { fonts, ranges };
}

interface Extra { file: string; url: string; sha256: string; bytes: number; license?: string; license_url?: string }
interface Extras { commit: string; license: string; license_url: string; fonts: Extra[] }

async function extraBytes(e: Extra): Promise<Uint8Array> {
  const path = resolve(repoRoot, "fonts/cache", `web-extra-${e.file}`);
  const bytes = existsSync(path) ? new Uint8Array(readFileSync(path)) : await downloadBytes(e.url);
  if (sha256Hex(bytes) !== e.sha256) throw new Error(`${e.file}: sha256 does not match data/web-font-extras.json`);
  writeFileSync(path, bytes);
  return bytes;
}

/** Issue #15: per-script Noto faces from data/web-font-extras.json, pinned and hash-checked. */
async function extraFonts(visible: Set<number>): Promise<{ fonts: WebFont[]; ranges: Record<string, number[][]> }> {
  const extras = JSON.parse(readFileSync(resolve(repoRoot, "data/web-font-extras.json"), "utf-8")) as Extras;
  const fonts: WebFont[] = [];
  const ranges: Record<string, number[][]> = {};
  for (const e of extras.fonts) {
    const bytes = await extraBytes(e);
    const font = fontkit.create(Buffer.from(bytes)) as fontkit.Font;
    fonts.push({ family: font.familyName, face: "Regular", weight: 400, style: "normal", url: e.url, format: "truetype", bytes: e.bytes, sha256: e.sha256, license: e.license ?? extras.license, license_url: e.license_url ?? extras.license_url, version: String(font.version ?? extras.commit.slice(0, 8)) });
    ranges[font.familyName] = compactRanges(readCmap(bytes).filter((cp) => visible.has(cp)));
  }
  return { fonts, ranges };
}

export interface SelfHost { family: string; key: string; file: string; download: string; format: string; version: string; bytes: number; sha256: string; license: string; license_url: string }

/** Q-14 option B: GNU Unifont 18 has no CORS-enabled public host, so the dialog offers a self-host template; ranges come from the vendored conversions. */
function selfHostFonts(visible: Set<number>): { entries: SelfHost[]; ranges: Record<string, number[][]> } {
  const manifest = readFontManifest(repoRoot);
  const entries: SelfHost[] = [];
  const ranges: Record<string, number[][]> = {};
  for (const font of ["unifont", "unifont_upper"].map((id) => manifest.fonts.find((f) => f.id === id)!)) {
    const key = `self-host:${font.id}`;
    entries.push({ family: "Unifont", key, file: font.source.url.split("/").pop()!, download: font.source.url, format: "opentype", version: font.version, bytes: font.source.bytes ?? 0, sha256: font.source.sha256 ?? "", license: "OFL-1.1 OR GPL-2.0-or-later WITH Font-exception-2.0", license_url: "https://unifoundry.com/LICENSE.txt" });
    ranges[key] = compactRanges(readCmap(new Uint8Array(readFileSync(resolve(repoRoot, font.vendored!)))).filter((cp) => visible.has(cp)));
  }
  return { entries, ranges };
}

function order(kitDir: string, variable: string, names: Map<string, string>, extra: string[]): string[] {
  const css = readFileSync(resolve(kitDir, "unicode-fonts.css"), "utf-8");
  const body = new RegExp(`--${variable}:([^;]+);`).exec(css)?.[1] ?? "";
  const list = [...body.matchAll(/"([^"]+)"/g)].map((m) => (m[1].startsWith("UK Unifont") ? "UnifontEX" : names.get(m[1]) ?? m[1]));
  const unique = [...new Set(list)].filter((f) => f !== "UnifontEX");
  return [...unique, ...extra, "UnifontEX"];
}

export async function buildWebFontTable(kitDir: string): Promise<void> {
  const visible = visibleAssignedSet(repoRoot);
  const kit = await kitFonts(kitDir, visible);
  const local = blockFonts(visible);
  const more = await extraFonts(visible);
  const self = selfHostFonts(visible);
  const extra = [...local.fonts, ...more.fonts].map((f) => f.family);
  const { unicode } = JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { unicode: string };
  const ranges = { ...kit.ranges, ...local.ranges, ...more.ranges, ...self.ranges };
  const table = {
    _doc: "Web fonts for the 'CSS for this selection' dialog (PLAN Q-13). Pinned public URLs (Unicode Font Kit remote profile, CORS-verified; block fonts from fonts/manifest.json). 'ranges' is deflate-raw+base64 JSON: family → visible assigned code points of the regular face as [start,end]|[cp] runs. Written by tools/fonts/buildWebFontTable.ts.",
    generated: new Date().toISOString().slice(0, 10), unicode,
    order: { serif: order(kitDir, "unicode-serif", kit.names, extra), sans: order(kitDir, "unicode-sans", kit.names, extra) },
    fonts: [...kit.fonts, ...local.fonts, ...more.fonts],
    self_host: self.entries,
    ranges: Buffer.from(deflateSync(strToU8(JSON.stringify(ranges)), { level: 9 })).toString("base64"),
  };
  writeFileSync(resolve(repoRoot, "data/web-fonts.json"), JSON.stringify(table, null, 1) + "\n");
  console.log(`web-fonts: ${table.fonts.length} faces, ${Object.keys(ranges).length} measured, serif order ${table.order.serif.length}, sans ${table.order.sans.length}, ranges ${table.ranges.length} chars base64`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildWebFontTable(process.argv[2] ?? "/tmp/kit/unicode-font-kit").catch((e: Error) => { console.error(`web-fonts FAILED — ${e.message}`); process.exit(1); });
}
