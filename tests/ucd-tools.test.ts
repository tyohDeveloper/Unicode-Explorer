import { describe, expect, it } from "vitest";
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
