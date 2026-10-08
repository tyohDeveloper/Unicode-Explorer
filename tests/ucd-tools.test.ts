import { describe, expect, it } from "vitest";
import { buildUnassignedRanges } from "../tools/ucd/buildUnassignedRanges.js";
import { encodeNameMap } from "../tools/ucd/encodeNameMap.js";
import { extractBlockRanges } from "../tools/ucd/extractBlockRanges.js";
import { parseBlocks } from "../tools/ucd/parseBlocks.js";
import { parseUnicodeData } from "../tools/ucd/parseUnicodeData.js";
import { readUcdFile } from "../tools/ucd/readUcdFile.js";
import { serializeUnassigned } from "../tools/ucd/serializeUnassigned.js";
import { repoRoot } from "./loadRuntime.js";

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

describe("serializeUnassigned / extractBlockRanges / encodeNameMap", () => {
  it("round-trips ranges through the JS literal", () => {
    const js = serializeUnassigned([[1, 1], [5, 9]]);
    expect(js).toBe("var UNASSIGNED=[\n[1],[5,9]\n];");
  });
  it("reads block ranges from the data file syntax", () => {
    expect(extractBlockRanges('var B=[["Basic Latin",0x0000,0x007F,"x"],["Tags",0xE0000,0xE007F,"y"]];')).toEqual([[0, 0x7f], [0xe0000, 0xe007f]]);
  });
  it("delta-encodes sorted names with shared prefix lengths", () => {
    const enc = encodeNameMap(new Map([[0x42, "LATIN B"], [0x41, "LATIN A"]]));
    expect(enc).toBe("0|LATIN A|41\n6|B|42");
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
