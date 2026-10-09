/**
 * Plan the outline packs (PLAN.md D-23, issue #16): choose OFL outline fonts
 * by measured gain over the characters the Complete editions still draw with
 * bitmap-style fonts (Unifont, Unifont Upper, Fairfax HD), subset each to the
 * whole blocks where it adds glyphs, group them by block category into packs
 * under the D-20 size limit, and write the font and pack entries into
 * fonts/manifest.json. A planning step: it reads the Noto Regular TTFs of the
 * pinned commit below, downloading them into fonts/cache/noto-src/ with
 * --fetch (CP4-06), or from a local directory with --noto; fetch:fonts and
 * build:packs then reproduce everything from the manifest.
 *
 *   npm run plan:outline -- --fetch
 *   npm run plan:outline -- --noto <dir of Noto *-Regular.ttf>
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFontManifest, writeFontManifest, type FontEntry, type FontManifest, type PackEntry } from "./fontManifest.js";
import { downloadBytes } from "./downloadBytes.js";
import { readCmap } from "./readCmap.js";
import { sha256Hex } from "./sha256Hex.js";
import { subsetSfnt } from "./subsetSfnt.js";
import { toWoff2 } from "./toWoff2.js";
import { visibleAssignedSet } from "./visibleAssignedSet.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const NOTO_COMMIT = "578d18e1cfce41c8cc93d0a0f514cac3a1affb2e";
const BITMAP = ["unifont", "unifont_upper", "fairfax-hd-latin-ext-g"];
/** A font must add at least this many characters to be worth a request. */
const MIN_GAIN = 4;
/** WOFF2 bytes per pack, so the base64 script stays under the 8 MiB D-20 limit. */
const MAX_PACK_WOFF2 = Math.floor(5.6 * 1024 * 1024);
const EXCLUDE = /KSSRotated|KSSVertical/;

type Block = { name: string; start: number; end: number; category: string };
interface Candidate { stem: string; family: string; ttf: Uint8Array; cps: Set<number> }
interface Chosen { c: Candidate; blocks: Block[]; gain: number; woff2: number }

const hex = (cp: number) => cp.toString(16).toUpperCase().padStart(4, "0");
const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Family name (name ID 1, Windows Unicode) from an SFNT's name table. */
function familyName(ttf: Uint8Array): string {
  const v = new DataView(ttf.buffer, ttf.byteOffset, ttf.byteLength);
  const tables = v.getUint16(4);
  for (let i = 0; i < tables; i++) {
    if (String.fromCharCode(...ttf.subarray(12 + i * 16, 16 + i * 16)) !== "name") continue;
    const base = v.getUint32(12 + i * 16 + 8), count = v.getUint16(base + 2), strings = base + v.getUint16(base + 4);
    for (let r = 0; r < count; r++) {
      const at = base + 6 + r * 12;
      if (v.getUint16(at) !== 3 || v.getUint16(at + 6) !== 1) continue;
      const len = v.getUint16(at + 8), off = strings + v.getUint16(at + 10);
      return Array.from({ length: len / 2 }, (_, k) => String.fromCharCode(v.getUint16(off + k * 2))).join("");
    }
  }
  throw new Error("no family name");
}

function rangeCps(ranges: readonly (readonly [string, string])[] | undefined): ((cp: number) => boolean) {
  if (!ranges) return () => true;
  const r = ranges.map(([a, b]) => [parseInt(a, 16), parseInt(b, 16)]);
  return (cp) => r.some(([a, b]) => cp >= a && cp <= b);
}

function woff2Cmap(path: string): number[] { return readCmap(new Uint8Array(readFileSync(resolve(repoRoot, path)))); }

/** Characters the Complete edition draws with a bitmap font when no device font has them. */
function bitmapTarget(m: FontManifest, visible: Set<number>, blocks: Block[]): Set<number> {
  const target = new Set<number>();
  for (const id of BITMAP) for (const cp of woff2Cmap(`fonts/cache/${id}.woff2`)) if (visible.has(cp)) target.add(cp);
  for (const cp of woff2Cmap("fonts/cache/charis-latin.woff2")) target.delete(cp);
  for (const pack of m.packs.filter((p) => p.kind === "blocks" && !p.id.startsWith("outline-"))) {
    const inSubset = rangeCps(pack.subset);
    const attached = blocks.filter((b) => (pack.blocks ?? []).includes(hex(b.start)));
    for (const id of pack.fonts) for (const cp of woff2Cmap(`fonts/cache/${id}.woff2`)) if (inSubset(cp) && attached.some((b) => cp >= b.start && cp <= b.end)) target.delete(cp);
  }
  return target;
}

function candidates(dir: string, visible: Set<number>): Candidate[] {
  return readdirSync(dir).filter((f) => f.endsWith("-Regular.ttf") && !EXCLUDE.test(f)).map((f) => {
    const ttf = new Uint8Array(readFileSync(resolve(dir, f)));
    return { stem: f.replace(/-Regular\.ttf$/, ""), family: familyName(ttf), ttf, cps: new Set(readCmap(ttf).filter((cp) => visible.has(cp))) };
  });
}

function gainOf(c: Candidate, open: Set<number>): number {
  let g = 0;
  for (const cp of c.cps) if (open.has(cp)) g++;
  return g;
}

/** Greedy by new characters covered; each pick claims whole blocks where it adds any. */
function choose(cands: Candidate[], target: Set<number>, blocks: Block[]): Omit<Chosen, "woff2">[] {
  const open = new Set(target), picked: Omit<Chosen, "woff2">[] = [];
  for (;;) {
    const best = cands.map((c) => ({ c, gain: gainOf(c, open) })).sort((a, b) => b.gain - a.gain || a.c.stem.localeCompare(b.c.stem))[0];
    if (!best || best.gain < MIN_GAIN) return picked;
    const mine = blocks.filter((b) => [...best.c.cps].some((cp) => cp >= b.start && cp <= b.end && open.has(cp)));
    for (const cp of best.c.cps) open.delete(cp);
    picked.push({ c: best.c, blocks: mine, gain: best.gain });
    cands = cands.filter((c) => c !== best.c);
  }
}

function subsetRanges(blocks: Block[]): [string, string][] { return blocks.map((b) => [hex(b.start), hex(b.end)]); }

function fontEntry(ch: Chosen): FontEntry {
  const base = `https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io@${NOTO_COMMIT}`;
  return {
    id: `outline-${kebab(ch.c.stem)}`, family: ch.c.family, css_family: `UE Outline ${ch.c.family}`, version: `notofonts.github.io@${NOTO_COMMIT.slice(0, 8)}`,
    license: "OFL-1.1", license_url: `https://github.com/notofonts/notofonts.github.io/blob/${NOTO_COMMIT}/fonts/LICENSE`,
    source: { url: `${base}/fonts/${ch.c.stem}/unhinted/ttf/${ch.c.stem}-Regular.ttf`, format: "ttf", sha256: sha256Hex(ch.c.ttf), bytes: ch.c.ttf.length },
    subset: subsetRanges(ch.blocks), role: "coverage", design: "outline",
    note: `D-23 outline pack font: ${ch.gain} characters otherwise drawn by a bitmap font in the Complete editions.`,
  };
}

/** Group by the category of each font's largest block, then split by size in pick order. */
function groupPacks(chosen: Chosen[]): { id: string; label: string; fonts: Chosen[] }[] {
  const byCat = new Map<string, Chosen[]>();
  for (const ch of chosen) {
    const top = [...ch.blocks].sort((a, b) => b.end - b.start - (a.end - a.start))[0].category;
    byCat.set(top, [...(byCat.get(top) ?? []), ch]);
  }
  const packs: { id: string; label: string; fonts: Chosen[] }[] = [];
  for (const [cat, list] of byCat) {
    const parts: Chosen[][] = [[]];
    for (const ch of list) { const last = parts[parts.length - 1]; if (last.length && last.reduce((s, x) => s + x.woff2, 0) + ch.woff2 > MAX_PACK_WOFF2) parts.push([ch]); else last.push(ch); }
    parts.forEach((fonts, i) => packs.push({ id: `outline-${kebab(cat)}${parts.length > 1 ? `-${i + 1}` : ""}`, label: `Outline: ${cat}${parts.length > 1 ? ` (part ${i + 1} of ${parts.length})` : ""}`, fonts }));
  }
  return packs;
}

function packEntry(p: { id: string; label: string; fonts: Chosen[] }, cats: string[]): PackEntry {
  const blocks = [...new Set(p.fonts.flatMap((ch) => ch.blocks.map((b) => hex(b.start))))];
  return { id: p.id, label: p.label, kind: "blocks", fonts: p.fonts.map((ch) => `outline-${kebab(ch.c.stem)}`), categories: cats, attach: "planned", blocks, license_files: ["fonts/licenses/Noto-OFL-1.1.txt"], editions: ["complete", "complete-hieroglyphs"] };
}

async function plan(notoDir: string): Promise<void> {
  const m = readFontManifest(repoRoot);
  const visible = visibleAssignedSet(repoRoot);
  const raw = JSON.parse(readFileSync(resolve(repoRoot, "src/data/blocks.json"), "utf-8")) as { blocks: [string, number, number, string][] };
  const blocks = raw.blocks.map(([name, start, end, category]) => ({ name, start, end, category }));
  m.fonts = m.fonts.filter((f) => !f.id.startsWith("outline-"));
  m.packs = m.packs.filter((p) => !p.id.startsWith("outline-"));
  const target = bitmapTarget(m, visible, blocks);
  const picks = choose(candidates(notoDir, visible), target, blocks);
  const chosen: Chosen[] = [];
  for (const p of picks) chosen.push({ ...p, woff2: (await toWoff2(subsetSfnt(p.c.ttf, subsetRanges(p.blocks)))).length });
  const packs = groupPacks(chosen);
  m.fonts.push(...chosen.map(fontEntry));
  const firstStyle = m.packs.findIndex((p) => p.kind === "style");
  m.packs.splice(firstStyle, 0, ...packs.map((p) => packEntry(p, [...new Set(p.fonts.flatMap((ch) => ch.blocks.map((b) => b.category)))])));
  for (const e of m.editions.filter((e) => e.packs?.length)) e.packs = [...e.packs!.filter((id) => !id.startsWith("outline-")), ...packs.map((p) => p.id)];
  writeFontManifest(repoRoot, m);
  const gain = chosen.reduce((s, c) => s + c.gain, 0);
  console.log(`plan:outline — target ${target.size} bitmap-drawn; ${chosen.length} fonts gain ${gain}; ${packs.length} packs, ${(chosen.reduce((s, c) => s + c.woff2, 0) / 1048576).toFixed(1)} MB WOFF2`);
}

/** GitHub API JSON; a token (GITHUB_TOKEN or GH_TOKEN) lifts the anonymous rate limit. */
async function githubJson<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "unicode-explorer-tools", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  return JSON.parse(new TextDecoder().decode(await downloadBytes(`https://api.github.com/repos/notofonts/notofonts.github.io/${path}`, headers))) as T;
}

/** CP4-06: the Regular TTFs at the pinned commit (listed with the GitHub tree API), cached by name. */
async function fetchNoto(): Promise<string> {
  const dir = resolve(repoRoot, "fonts/cache/noto-src");
  mkdirSync(dir, { recursive: true });
  type Tree = { tree: { path: string; sha: string }[]; truncated: boolean };
  const root = await githubJson<Tree>(`git/trees/${NOTO_COMMIT}`);
  const fonts = await githubJson<Tree>(`git/trees/${root.tree.find((t) => t.path === "fonts")!.sha}?recursive=1`);
  if (fonts.truncated) throw new Error("GitHub tree listing truncated");
  const files = fonts.tree.map((t) => t.path).filter((n) => /^[^/]+\/unhinted\/ttf\/[^/]+-Regular\.ttf$/.test(n));
  for (const name of files) {
    const path = resolve(dir, name.split("/").pop()!);
    if (!existsSync(path)) writeFileSync(path, await downloadBytes(`https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io@${NOTO_COMMIT}/fonts/${name}`));
  }
  console.log(`plan:outline — ${files.length} Noto Regular TTFs in fonts/cache/noto-src`);
  return dir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const local = args.includes("--noto") ? args[args.indexOf("--noto") + 1] : "";
  if (!local && !args.includes("--fetch")) { console.error("usage: plan:outline -- --fetch | --noto <dir of Noto *-Regular.ttf>"); process.exit(1); }
  (local ? Promise.resolve(local) : fetchNoto()).then(plan).catch((e: Error) => { console.error(`plan:outline FAILED — ${e.message}`); process.exit(1); });
}
