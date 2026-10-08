/**
 * Generate src/data/*.json from the vendored UCD and the authored tables in
 * data/. Committed output; scripts/verify-regenerated.mjs proves it matches.
 *
 *   npm run generate:data
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readUcdFile } from "./readUcdFile.js";
import { parseUnicodeData } from "./parseUnicodeData.js";
import { parseBlocks } from "./parseBlocks.js";
import { joinBlockCategories } from "./joinBlockCategories.js";
import { buildUnassignedRanges } from "./buildUnassignedRanges.js";
import { compressNameTable } from "./compressNameTable.js";
import { parsePropertyRanges } from "./parsePropertyRanges.js";
import { parseNameAliases } from "./parseNameAliases.js";
import { parseAllAliases } from "./parseAllAliases.js";
import { buildVisibility } from "./buildVisibility.js";
import { buildMarkRanges } from "./buildMarkRanges.js";
import { parseDerivedNameRanges, type DerivedNameRange } from "./parseDerivedNameRanges.js";
import { parseRangeValues } from "./parseRangeValues.js";
import { parseValueAliases } from "./parseValueAliases.js";
import { buildProperties } from "./buildProperties.js";
import type { UnicodeData } from "./parseUnicodeData.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = resolve(repoRoot, "src/data");

function writeJson(name: string, value: unknown): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, name), JSON.stringify(value) + "\n");
}

const compact = (ranges: [number, number][]) => ranges.map(([s, e]) => (s === e ? [s] : [s, e]));

function generateProperties(unicode: string, categoryMap: Map<number, string>): { hidden: number; marks: number; abbreviations: number } {
  const ignorable = parsePropertyRanges(readUcdFile(repoRoot, unicode, "DerivedCoreProperties.txt"), "Default_Ignorable_Code_Point");
  const prepended = parsePropertyRanges(readUcdFile(repoRoot, unicode, "PropList.txt"), "Prepended_Concatenation_Mark");
  const hidden = buildVisibility(categoryMap, ignorable, prepended);
  const marks = buildMarkRanges(categoryMap);
  const aliasText = readUcdFile(repoRoot, unicode, "NameAliases.txt");
  const aliases = parseNameAliases(aliasText);
  const allAliases = parseAllAliases(aliasText);
  writeJson("aliases.json", { unicode, map: Object.fromEntries([...allAliases].map(([cp, a]) => [cp.toString(16).toUpperCase().padStart(4, "0"), a])) });
  writeJson("visibility.json", { unicode, hidden });
  writeJson("marks.json", { unicode, ranges: compact(marks) });
  writeJson("abbreviations.json", { unicode, map: Object.fromEntries([...aliases].map(([cp, a]) => [cp.toString(16).toUpperCase().padStart(4, "0"), a])) });
  return { hidden: hidden.length, marks: marks.length, abbreviations: aliases.size };
}

/** D-18: drop names that a DerivedName.txt prefix range reproduces exactly; fail if one does not. */
function namesOutsideDerived(nameMap: ReadonlyMap<number, string>, ranges: readonly DerivedNameRange[]): Map<number, string> {
  const numeric = ranges.map((r) => ({ start: parseInt(r.start, 16), end: parseInt(r.end, 16), prefix: r.prefix }));
  const kept = new Map<number, string>();
  for (const [cp, name] of nameMap) {
    const r = numeric.find((x) => cp >= x.start && cp <= x.end);
    if (!r) { kept.set(cp, name); continue; }
    if (name !== r.prefix + cp.toString(16).toUpperCase().padStart(4, "0")) throw new Error(`U+${cp.toString(16)} ${name} does not match DerivedName prefix ${r.prefix}`);
  }
  return kept;
}

function generateProps(unicode: string, ucd: UnicodeData): number {
  const values = readUcdFile(repoRoot, unicode, "PropertyValueAliases.txt");
  const scripts = parseRangeValues(readUcdFile(repoRoot, unicode, "Scripts.txt")).map(([s, e, v]) => [s, e, v.replace(/_/g, " ")] as [number, number, string]);
  const ages = parseRangeValues(readUcdFile(repoRoot, unicode, "DerivedAge.txt"));
  const gcNames = new Map([...parseValueAliases(values, "gc")].map(([k, v]) => [k, v.replace(/_/g, " ")]));
  const { data } = buildProperties({ categoryMap: ucd.categoryMap, decompositionMap: ucd.decompositionMap, scripts, ages, gcNames });
  writeJson("properties.json", { unicode, encoding: "deflate-raw+base64", data });
  return data.length;
}

export function generateData(): Record<string, number> {
  const { unicode } = JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { unicode: string };
  const { categories } = JSON.parse(readFileSync(resolve(repoRoot, "data/block-categories.json"), "utf-8")) as { categories: Record<string, string> };
  const blocks = joinBlockCategories(parseBlocks(readUcdFile(repoRoot, unicode, "Blocks.txt")), categories);
  const ucd = parseUnicodeData(readUcdFile(repoRoot, unicode, "UnicodeData.txt"));
  const { assigned, categoryMap } = ucd;
  const derived = parseDerivedNameRanges(readUcdFile(repoRoot, unicode, "DerivedName.txt"));
  const nameMap = namesOutsideDerived(ucd.nameMap, derived);
  writeJson("algorithmic-names.json", { unicode, ranges: derived });
  const ranges = buildUnassignedRanges(blocks.map((b) => [b.start, b.end]), assigned);
  writeJson("blocks.json", { unicode, blocks: blocks.map((b) => [b.name, b.start, b.end, b.category]) });
  writeJson("unassigned.json", { unicode, ranges: compact(ranges) });
  writeJson("names.json", { unicode, count: nameMap.size, encoding: "deflate-raw+base64", data: compressNameTable(nameMap) });
  const properties = generateProps(unicode, ucd);
  return { blocks: blocks.length, ranges: ranges.length, names: nameMap.size, derived: derived.length, properties, ...generateProperties(unicode, categoryMap) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = generateData();
  console.log(`generate:data — ${r.blocks} blocks, ${r.ranges} unassigned ranges, ${r.names} names, ${r.hidden} hidden runs, ${r.marks} mark ranges, ${r.abbreviations} abbreviations, ${r.derived} derived-name ranges, properties ${r.properties} B → src/data/`);
}
