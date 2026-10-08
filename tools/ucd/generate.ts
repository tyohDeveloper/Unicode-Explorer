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

export function generateData(): Record<string, number> {
  const { unicode } = JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { unicode: string };
  const { categories } = JSON.parse(readFileSync(resolve(repoRoot, "data/block-categories.json"), "utf-8")) as { categories: Record<string, string> };
  const blocks = joinBlockCategories(parseBlocks(readUcdFile(repoRoot, unicode, "Blocks.txt")), categories);
  const { assigned, nameMap, categoryMap } = parseUnicodeData(readUcdFile(repoRoot, unicode, "UnicodeData.txt"));
  const ranges = buildUnassignedRanges(blocks.map((b) => [b.start, b.end]), assigned);
  writeJson("blocks.json", { unicode, blocks: blocks.map((b) => [b.name, b.start, b.end, b.category]) });
  writeJson("unassigned.json", { unicode, ranges: compact(ranges) });
  writeJson("names.json", { unicode, count: nameMap.size, encoding: "deflate-raw+base64", data: compressNameTable(nameMap) });
  return { blocks: blocks.length, ranges: ranges.length, names: nameMap.size, ...generateProperties(unicode, categoryMap) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = generateData();
  console.log(`generate:data — ${r.blocks} blocks, ${r.ranges} unassigned ranges, ${r.names} names, ${r.hidden} hidden runs, ${r.marks} mark ranges, ${r.abbreviations} abbreviations → src/data/`);
}
