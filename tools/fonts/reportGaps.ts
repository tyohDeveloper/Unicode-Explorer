/**
 * Missing-glyph report (font watch, PLAN.md Phase 7): every visible assigned
 * character that no shipped font maps, per edition and per block, plus what no
 * public web font in data/web-fonts.json maps. Writes docs/coverage/missing-glyphs.json
 * and .md and prints the change against the committed snapshot, so re-running it
 * after `npm run fetch:fonts` (new font versions or candidates) shows what was closed.
 *
 *   npm run report:gaps
 *
 * Measured from character maps (cmaps): a mapped character is not proof of correct
 * shaping. Reads fonts/cache/ for pack fonts (run fetch:fonts first) and
 * docs/coverage/gap-issues.json for the tracking issue of each block.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync, strFromU8 } from "fflate";
import { fontById, readFontManifest, type FontManifest } from "./fontManifest.js";
import { readCmap } from "./readCmap.js";
import { visibleAssignedSet } from "./visibleAssignedSet.js";
import { parseRangeValues } from "../ucd/parseRangeValues.js";
import { readUcdFile } from "../ucd/readUcdFile.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = resolve(repoRoot, "docs/coverage");
type Block = { name: string; start: number; end: number; category: string };
interface BlockGap { block: string; start: string; visible: number; missing: Record<string, number>; ranges: string[]; added_in: Record<string, number>; issue?: number }
interface Report { generated: string; unicode: string; app: string; data: string; editions: Record<string, { covered: number; of: number }>; blocks: BlockGap[]; candidates: { id: string; family: string; version: string; note: string }[] }

const hex = (cp: number) => cp.toString(16).toUpperCase().padStart(4, "0");
const json = <T>(path: string): T => JSON.parse(readFileSync(resolve(repoRoot, path), "utf-8")) as T;

function fontCmap(id: string, vendored?: string): number[] {
  const path = resolve(repoRoot, vendored ?? `fonts/cache/${id}.woff2`);
  if (!existsSync(path)) throw new Error(`${path} is missing; run npm run fetch:fonts`);
  return readCmap(new Uint8Array(readFileSync(path)));
}

/** What an edition actually ships: embedded fonts' full cmaps plus each pack's cmap, restricted to its subset ranges (D-20). */
function editionCmap(m: FontManifest, editionId: string): Set<number> {
  const edition = m.editions.find((e) => e.id === editionId)!;
  const packed = new Set(m.packs.flatMap((p) => p.fonts));
  const out = new Set<number>();
  for (const id of edition.fonts.filter((f) => fontById(m, f).role === "coverage" && !packed.has(f))) for (const cp of fontCmap(id, fontById(m, id).vendored)) out.add(cp);
  for (const pack of m.packs.filter((p) => edition.packs?.includes(p.id))) {
    const ranges = pack.subset?.map(([a, b]) => [parseInt(a, 16), parseInt(b, 16)]);
    for (const id of pack.fonts) for (const cp of fontCmap(id)) if (!ranges || ranges.some(([a, b]) => cp >= a && cp <= b)) out.add(cp);
  }
  return out;
}

function webCmap(): Set<number> {
  const { ranges } = json<{ ranges: string }>("data/web-fonts.json");
  const table = JSON.parse(strFromU8(inflateSync(Buffer.from(ranges, "base64")))) as Record<string, number[][]>;
  const out = new Set<number>();
  for (const runs of Object.values(table)) for (const r of runs) for (let cp = r[0]; cp <= (r[1] ?? r[0]); cp++) out.add(cp);
  return out;
}

function compactRanges(cps: readonly number[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < cps.length; i++) {
    let j = i;
    while (j + 1 < cps.length && cps[j + 1] === cps[j] + 1) j++;
    out.push(i === j ? hex(cps[i]) : `${hex(cps[i])}..${hex(cps[j])}`);
    i = j;
  }
  return out;
}

function blockGap(b: Block, visible: Set<number>, sets: Record<string, Set<number>>, ageOf: (cp: number) => string): BlockGap | null {
  const cps: number[] = [];
  for (let cp = b.start; cp <= b.end; cp++) if (visible.has(cp)) cps.push(cp);
  const missing = Object.fromEntries(Object.entries(sets).map(([k, s]) => [k, cps.filter((cp) => !s.has(cp)).length]));
  if (Object.values(missing).every((n) => n === 0)) return null;
  const hard = cps.filter((cp) => !sets["complete-hieroglyphs"].has(cp));
  const added_in: Record<string, number> = {};
  for (const cp of hard) added_in[ageOf(cp)] = (added_in[ageOf(cp)] ?? 0) + 1;
  return { block: b.name, start: hex(b.start), visible: cps.length, missing, ranges: compactRanges(hard), added_in };
}

function buildReport(): Report {
  const m = readFontManifest(repoRoot);
  const version = json<{ unicode: string; data: string }>("data/version.json");
  const visible = visibleAssignedSet(repoRoot);
  const sets: Record<string, Set<number>> = Object.fromEntries(m.editions.map((e) => [e.id, editionCmap(m, e.id)]));
  sets.web = webCmap();
  const ages = parseRangeValues(readUcdFile(repoRoot, version.unicode, "DerivedAge.txt"));
  const ageOf = (cp: number) => ages.find(([s, e]) => cp >= s && cp <= e)?.[2] ?? "?";
  const issues = existsSync(resolve(outDir, "gap-issues.json")) ? json<Record<string, number>>("docs/coverage/gap-issues.json") : {};
  const blocks = json<{ blocks: [string, number, number, string][] }>("src/data/blocks.json").blocks.map(([name, start, end, category]) => ({ name, start, end, category }));
  const gaps = blocks.map((b) => blockGap(b, visible, sets, ageOf)).filter((g): g is BlockGap => g !== null).map((g) => (issues[g.start] ? { ...g, issue: issues[g.start] } : g));
  const editions = Object.fromEntries(Object.entries(sets).map(([k, s]) => [k, { covered: [...visible].filter((cp) => s.has(cp)).length, of: visible.size }]));
  const candidates = (m.candidates ?? []).map((c) => ({ id: c.id, family: c.family, version: c.version, note: c.note ?? "" }));
  return { generated: new Date().toISOString().slice(0, 10), unicode: version.unicode, app: json<{ version: string }>("package.json").version, data: version.data, editions, blocks: gaps, candidates };
}

const pct = (a: number, b: number) => `${((a / b) * 100).toFixed(1)}%`;
const n = (x: number) => x.toLocaleString("en-US");

function markdown(r: Report): string {
  const repo = "https://github.com/tyohDeveloper/Unicode-Explorer/issues/";
  const eds = Object.entries(r.editions).map(([k, e]) => `| ${k === "web" ? "Public web fonts (CSS dialog)" : k} | ${n(e.covered)} | ${n(e.of - e.covered)} | ${pct(e.covered, e.of)} |`);
  const hard = r.blocks.filter((b) => b.missing["complete-hieroglyphs"] > 0);
  const hardRows = hard.map((b) => `| ${b.block} (U+${b.start}) | ${n(b.visible)} | ${n(b.missing["complete-hieroglyphs"])} | ${Object.entries(b.added_in).map(([v, c]) => `${v}: ${n(c)}`).join(", ")} | ${b.ranges.slice(0, 4).join(", ")}${b.ranges.length > 4 ? ` … (${b.ranges.length} runs)` : ""} | ${b.issue ? `[#${b.issue}](${repo}${b.issue})` : ""} |`);
  const soft = r.blocks.filter((b) => b.missing["complete-hieroglyphs"] === 0 && b.missing.standard > 0);
  const softRows = soft.map((b) => `| ${b.block} | ${n(b.visible)} | ${n(b.missing.standard)} | ${n(b.missing.complete)} |`);
  const webRows = r.blocks.filter((b) => b.missing.web > 0).sort((a, b) => b.missing.web - a.missing.web).slice(0, 25).map((b) => `| ${b.block} | ${n(b.missing.web)} of ${n(b.visible)} |`);
  return [
    `# Missing glyphs`, ``,
    `Generated ${r.generated} by \`npm run report:gaps\` for app ${r.app}, data ${r.data}, Unicode ${r.unicode}. Counts are visible assigned characters that no font in the edition maps (character-map measurement). Machine-readable: [missing-glyphs.json](missing-glyphs.json). Re-run after \`npm run fetch:fonts\` to see what new font releases close; the command prints the change against this snapshot.`, ``,
    `| Edition | With a font | Missing | Coverage |`, `|---|---:|---:|---:|`, ...eds, ``,
    `## Missing from every edition`, ``, `No shipped or packed font maps these. Each has a tracking issue.`, ``,
    `| Block | Visible | Missing | Added in Unicode | Missing code points | Issue |`, `|---|---:|---:|---|---|---|`, ...hardRows, ``,
    `## Covered only by the Complete packs`, ``, `| Block | Visible | Missing in Standard | Missing in Complete |`, `|---|---:|---:|---:|`, ...softRows, ``,
    `## Not in any public web font (largest 25 blocks)`, ``, `What the CSS dialog cannot offer another programmer.`, ``, `| Block | Missing |`, `|---|---:|`, ...webRows, ``,
    `## Candidate fonts not shipped`, ``, ...r.candidates.map((c) => `- **${c.family}** ${c.version}: ${c.note}`), ``,
  ].join("\n");
}

function compare(previous: Report | null, next: Report): string[] {
  if (!previous) return ["no previous snapshot"];
  const lines = Object.entries(next.editions).map(([k, e]) => `${k}: ${n(previous.editions[k]?.covered ?? 0)} → ${n(e.covered)} (${e.covered - (previous.editions[k]?.covered ?? 0) >= 0 ? "+" : ""}${e.covered - (previous.editions[k]?.covered ?? 0)})`);
  for (const b of next.blocks) {
    const was = previous.blocks.find((p) => p.start === b.start)?.missing["complete-hieroglyphs"] ?? 0;
    if (was !== b.missing["complete-hieroglyphs"]) lines.push(`  ${b.block}: missing ${was} → ${b.missing["complete-hieroglyphs"]}`);
  }
  for (const p of previous.blocks) if (!next.blocks.some((b) => b.start === p.start) && p.missing["complete-hieroglyphs"]) lines.push(`  ${p.block}: missing ${p.missing["complete-hieroglyphs"]} → 0 (closed)`);
  return lines;
}

export function reportGaps(): void {
  const jsonPath = resolve(outDir, "missing-glyphs.json");
  const previous = existsSync(jsonPath) ? (JSON.parse(readFileSync(jsonPath, "utf-8")) as Report) : null;
  const report = buildReport();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(report, null, 1) + "\n");
  writeFileSync(resolve(outDir, "missing-glyphs.md"), markdown(report));
  console.log(`report:gaps — ${report.blocks.length} blocks with gaps\n${compare(previous, report).join("\n")}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) reportGaps();
