import { describe, expect, it } from "vitest";
import { parsePropertyRanges } from "../tools/ucd/parsePropertyRanges.js";
import { parseNameAliases } from "../tools/ucd/parseNameAliases.js";
import { buildVisibility } from "../tools/ucd/buildVisibility.js";
import { buildMarkRanges } from "../tools/ucd/buildMarkRanges.js";
import { buildUnassignedRanges } from "../tools/ucd/buildUnassignedRanges.js";
import { encodeNameMap } from "../tools/ucd/encodeNameMap.js";
import { parseBlocks } from "../tools/ucd/parseBlocks.js";
import { parseUnicodeData } from "../tools/ucd/parseUnicodeData.js";
import { readUcdFile } from "../tools/ucd/readUcdFile.js";
import { joinBlockCategories } from "../tools/ucd/joinBlockCategories.js";
import { compressNameTable } from "../tools/ucd/compressNameTable.js";
import { decodeNameTable } from "../src/names/decodeNameTable.js";
import { inflateRawSync } from "node:zlib";
import { repoRoot } from "./ucdFixture.js";

describe("parseUnicodeData", () => {
  it("expands First/Last ranges into assigned code points without naming them", () => {
    const text = "0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;\n" +
      "4E00;<CJK Ideograph, First>;Lo;0;L;;;;;N;;;;;\n4E02;<CJK Ideograph, Last>;Lo;0;L;;;;;N;;;;;\n" +
      "0000;<control>;Cc;0;BN;;;;;N;NULL;;;;\n";
    const { assigned, nameMap, categoryMap } = parseUnicodeData(text);
    expect([...assigned].sort((a, b) => a - b)).toEqual([0, 0x41, 0x4e00, 0x4e01, 0x4e02]);
    expect([...nameMap.keys()]).toEqual([0x41]);
    expect(categoryMap.get(0x4e01)).toBe("Lo");
    expect(categoryMap.get(0)).toBe("Cc");
  });
});

describe("buildUnassignedRanges", () => {
  it("finds runs and skips surrogates, private use, and noncharacters", () => {
    const assigned = new Set([0x10, 0x11, 0x14]);
    expect(buildUnassignedRanges([[0x10, 0x16]], assigned)).toEqual([[0x12, 0x13], [0x15, 0x16]]);
    expect(buildUnassignedRanges([[0xd7fe, 0xd801]], new Set([0xd7fe]))).toEqual([[0xd7ff, 0xd7ff]]);
    expect(buildUnassignedRanges([[0xfffd, 0xffff]], new Set([0xfffd]))).toEqual([]);
  });
});

describe("name table encoding", () => {
  it("delta-encodes sorted names with shared prefix lengths", () => {
    const enc = encodeNameMap(new Map([[0x42, "LATIN B"], [0x41, "LATIN A"]]));
    expect(enc).toBe("0|LATIN A|41\n6|B|42");
  });
  it("round-trips through raw DEFLATE and the runtime decoder", () => {
    const map = new Map([[0x41, "LATIN CAPITAL LETTER A"], [0x42, "LATIN CAPITAL LETTER B"], [0x1f600, "GRINNING FACE"]]);
    const b64 = compressNameTable(map);
    expect(decodeNameTable(inflateRawSync(Buffer.from(b64, "base64")).toString("utf-8"))).toEqual(map);
  });
});

describe("joinBlockCategories", () => {
  const blocks = [{ name: "Basic Latin", start: 0, end: 0x7f }];
  it("attaches categories", () => {
    expect(joinBlockCategories(blocks, { "Basic Latin": "Latin & Extensions" })).toEqual([{ name: "Basic Latin", start: 0, end: 0x7f, category: "Latin & Extensions" }]);
  });
  it("fails on a block without a category or a category for an unknown block", () => {
    expect(() => joinBlockCategories(blocks, {})).toThrow(/no category/);
    expect(() => joinBlockCategories(blocks, { "Basic Latin": "x", Ghost: "y" })).toThrow(/not in Blocks.txt/);
  });
});

describe("readUcdFile", () => {
  it("rejects files that are not in the manifest", () => {
    expect(() => readUcdFile(repoRoot, "17.0.0", "NotAFile.txt")).toThrow(/not listed/);
  });
  it("parses the vendored Blocks.txt", () => {
    const blocks = parseBlocks(readUcdFile(repoRoot, "17.0.0", "Blocks.txt"));
    expect(blocks[0]).toEqual({ name: "Basic Latin", start: 0, end: 0x7f });
    expect(blocks.length).toBe(346);
  });
});

describe("property parsing and visibility", () => {
  it("parsePropertyRanges reads one property's ranges and ignores others", () => {
    const text = "# comment\n00AD          ; Default_Ignorable_Code_Point # Cf\n0600..0605    ; Prepended_Concatenation_Mark # Cf [6]\nFE00..FE0F    ; Default_Ignorable_Code_Point # Mn [16]\n";
    expect(parsePropertyRanges(text, "Default_Ignorable_Code_Point")).toEqual([[0xad, 0xad], [0xfe00, 0xfe0f]]);
    expect(parsePropertyRanges(text, "Prepended_Concatenation_Mark")).toEqual([[0x600, 0x605]]);
  });

  it("parseNameAliases keeps the first abbreviation per code point", () => {
    const text = "0000;NULL;control\n0000;NUL;abbreviation\n200D;ZWJ;abbreviation\nFEFF;BOM;abbreviation\nFEFF;ZWNBSP;abbreviation\n";
    expect([...parseNameAliases(text)]).toEqual([[0, "NUL"], [0x200d, "ZWJ"], [0xfeff, "BOM"]]);
  });

  it("buildVisibility hides by category and ignorability, keeps prepended marks, merges runs by kind", () => {
    const categories = new Map<number, string>([[0, "Cc"], [1, "Cc"], [0x41, "Lu"], [0x600, "Cf"], [0xad, "Cf"], [0xfe00, "Mn"], [0xe000, "Co"], [0x2028, "Zl"]]);
    const runs = buildVisibility(categories, [[0xad, 0xad], [0xfe00, 0xfe00]], [[0x600, 0x600]]);
    expect(runs).toContainEqual([0, 1, "cc"]);
    expect(runs).toContainEqual([0xad, 0xad, "cf"]);
    expect(runs).toContainEqual([0xfe00, 0xfe00, "di"]);
    expect(runs).toContainEqual([0xe000, 0xe000, "co"]);
    expect(runs).toContainEqual([0x2028, 0x2028, "z"]);
    expect(runs).toContainEqual([0xfdd0, 0xfdef, "nc"]);
    expect(runs.some(([s]) => s === 0x600 || s === 0x41)).toBe(false);
  });

  it("buildMarkRanges merges Mn/Mc/Me into sorted ranges", () => {
    expect(buildMarkRanges(new Map([[0x300, "Mn"], [0x301, "Mn"], [0x302, "Mn"], [0x41, "Lu"], [0x93e, "Mc"], [0x20dd, "Me"]]))).toEqual([[0x300, 0x302], [0x93e, 0x93e], [0x20dd, 0x20dd]]);
  });
});
