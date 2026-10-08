/**
 * Evaluate the pure runtime files (data/algo-ranges.js, data/charnames.js,
 * js/00-classify.js) in a Node VM with the generated tables injected, exactly
 * as the build concatenates them. Returns the global functions so tests can
 * exercise the shipped logic without a DOM. Phase 3 replaces this with
 * ordinary module imports.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createContext, runInContext } from "node:vm";
import LZString from "lz-string";
import { readUcdFile } from "../tools/ucd/readUcdFile.js";
import { parseUnicodeData } from "../tools/ucd/parseUnicodeData.js";
import { extractBlockRanges } from "../tools/ucd/extractBlockRanges.js";
import { buildUnassignedRanges } from "../tools/ucd/buildUnassignedRanges.js";
import { serializeUnassigned } from "../tools/ucd/serializeUnassigned.js";
import { serializeNameMap } from "../tools/ucd/serializeNameMap.js";

export const repoRoot = resolve(import.meta.dirname, "..");
const srcDir = resolve(repoRoot, "unicode-src");
const read = (rel: string) => readFileSync(resolve(srcDir, rel), "utf-8");

export interface Runtime {
  getCharName(cp: number): string;
  isNonVisible(cp: number): boolean;
  isReserved(cp: number): boolean;
  cpToStr(cp: number): string;
  cpHex(cp: number): string;
  hex4(cp: number): string;
  BLOCKS: [string, number, number, string][];
  UNASSIGNED: number[][];
}

export const unicodeVersion = (JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { unicode: string }).unicode;
export const ucd = parseUnicodeData(readUcdFile(repoRoot, unicodeVersion, "UnicodeData.txt"));

export function loadRuntime(): Runtime {
  const ranges = buildUnassignedRanges(extractBlockRanges(read("data/blocks.js")), ucd.assigned);
  const code = [
    serializeUnassigned(ranges),
    serializeNameMap(ucd.nameMap),
    read("data/blocks.js"),
    read("data/algo-ranges.js"),
    read("data/charnames.js"),
    read("js/00-classify.js"),
  ].join("\n");
  const ctx = createContext({ LZString });
  runInContext(code, ctx);
  return ctx as unknown as Runtime;
}
