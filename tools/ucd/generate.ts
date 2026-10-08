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

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = resolve(repoRoot, "src/data");

function writeJson(name: string, value: unknown): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, name), JSON.stringify(value) + "\n");
}

export function generateData(): { blocks: number; ranges: number; names: number } {
  const { unicode } = JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { unicode: string };
  const { categories } = JSON.parse(readFileSync(resolve(repoRoot, "data/block-categories.json"), "utf-8")) as { categories: Record<string, string> };
  const blocks = joinBlockCategories(parseBlocks(readUcdFile(repoRoot, unicode, "Blocks.txt")), categories);
  const { assigned, nameMap } = parseUnicodeData(readUcdFile(repoRoot, unicode, "UnicodeData.txt"));
  const ranges = buildUnassignedRanges(blocks.map((b) => [b.start, b.end]), assigned);
  writeJson("blocks.json", { unicode, blocks: blocks.map((b) => [b.name, b.start, b.end, b.category]) });
  writeJson("unassigned.json", { unicode, ranges: ranges.map(([s, e]) => (s === e ? [s] : [s, e])) });
  writeJson("names.json", { unicode, count: nameMap.size, encoding: "deflate-raw+base64", data: compressNameTable(nameMap) });
  return { blocks: blocks.length, ranges: ranges.length, names: nameMap.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = generateData();
  console.log(`generate:data — ${r.blocks} blocks, ${r.ranges} unassigned ranges, ${r.names} names → src/data/`);
}
