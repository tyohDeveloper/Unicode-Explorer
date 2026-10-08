/** Shared test fixture: the vendored UCD for the build's data version, plus the decoded name table. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import { parseUnicodeData } from "../tools/ucd/parseUnicodeData.js";
import { readUcdFile } from "../tools/ucd/readUcdFile.js";
import { decodeNameTable } from "../src/names/decodeNameTable.js";
import names from "../src/data/names.json";

export const repoRoot = resolve(import.meta.dirname, "..");
export const unicodeVersion = (JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { unicode: string }).unicode;
export const ucd = parseUnicodeData(readUcdFile(repoRoot, unicodeVersion, "UnicodeData.txt"));
export const nameTable: ReadonlyMap<number, string> = decodeNameTable(inflateRawSync(Buffer.from(names.data, "base64")).toString("utf-8"));
export const nameOf = (cp: number): string => resolveName(cp);

import { resolveCharName } from "../src/ucd/resolveCharName.js";
function resolveName(cp: number): string { return resolveCharName(nameTable, cp); }
