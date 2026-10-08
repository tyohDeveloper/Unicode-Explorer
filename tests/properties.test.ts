import { describe, expect, it } from "vitest";
import { inflateRawSync } from "node:zlib";
import table from "../src/data/properties.json";
import { encodeRuns } from "../tools/ucd/encodeRuns.js";
import { mapToRanges } from "../tools/ucd/mapToRanges.js";
import { parseDerivedNameRanges } from "../tools/ucd/parseDerivedNameRanges.js";
import { parseRangeValues } from "../tools/ucd/parseRangeValues.js";
import { parseValueAliases } from "../tools/ucd/parseValueAliases.js";
import { decodeRuns } from "../src/properties/decodeRuns.js";
import { lookupRun } from "../src/properties/lookupRun.js";
import { decodeProperties, type PropertyTable } from "../src/properties/decodeProperties.js";
import { describeCharacter } from "../src/properties/describeCharacter.js";
import { hangulDecomposition } from "../src/properties/hangulDecomposition.js";
import { nameOf } from "./ucdFixture.js";

const props = decodeProperties(JSON.parse(inflateRawSync(Buffer.from(table.data, "base64")).toString("utf-8")) as PropertyTable);
const field = (cp: number, label: string) => describeCharacter({ cp, props, nameOf, aliases: [], block: null, rendered: null }).find(([k]) => k === label)?.[1];

describe("UCD tools for D-18 and D-19", () => {
  it("reads DerivedName prefix ranges, including single code points", () => {
    expect(parseDerivedNameRanges("3D000..3FC3F  ; SMALL SEAL CHARACTER-*\n18CFF         ; KHITAN SMALL SCRIPT CHARACTER-*\n0041 ; LATIN CAPITAL LETTER A\n"))
      .toEqual([{ start: "3D000", end: "3FC3F", prefix: "SMALL SEAL CHARACTER-" }, { start: "18CFF", end: "18CFF", prefix: "KHITAN SMALL SCRIPT CHARACTER-" }]);
  });
  it("reads range/value files and value aliases", () => {
    expect(parseRangeValues("0041..005A    ; Latin # L&  [26]\n0030 ; Common # Nd\n")).toEqual([[0x30, 0x30, "Common"], [0x41, 0x5a, "Latin"]]);
    expect(parseValueAliases("gc ; Lu                               ; Uppercase_Letter\nsc ; Seal ; Seal\n", "gc").get("Lu")).toBe("Uppercase_Letter");
  });
  it("round-trips run encoding with gaps and merges adjacent equal values", () => {
    const enc = encodeRuns([[0x41, 0x41, "Lu"], [0x42, 0x5a, "Lu"], [0x61, 0x7a, "Ll"]]);
    expect(enc).toEqual({ values: ["Lu", "Ll"], runs: [0x41, 26, 0, 6, 26, 1] });
    const dec = decodeRuns(enc.runs);
    expect([lookupRun(dec, 0x40), lookupRun(dec, 0x41), lookupRun(dec, 0x5a), lookupRun(dec, 0x5b), lookupRun(dec, 0x7a)]).toEqual([-1, 0, 0, -1, 1]);
    expect(mapToRanges(new Map([[1, "a"], [2, "a"], [4, "a"]]))).toEqual([[1, 2, "a"], [4, 4, "a"]]);
  });
});

describe("character details (D-19, DAT-05)", () => {
  it("gives category, script, age and canonical decomposition for é", () => {
    expect(field(0xe9, "Category")).toBe("Ll Lowercase Letter");
    expect(field(0xe9, "Script")).toBe("Latin");
    expect(field(0xe9, "Age")).toBe("Unicode 1.1");
    expect(field(0xe9, "Decomposition")).toBe("canonical: U+0065 LATIN SMALL LETTER E + U+0301 COMBINING ACUTE ACCENT");
  });
  it("labels compatibility decompositions and computes Hangul syllables", () => {
    expect(field(0xfb01, "Decomposition")).toBe("compat: U+0066 LATIN SMALL LETTER F + U+0069 LATIN SMALL LETTER I");
    expect(hangulDecomposition(0xac01)).toEqual([0x1100, 0x1161, 0x11a8]);
    expect(hangulDecomposition(0xac00)).toEqual([0x1100, 0x1161]);
    expect(hangulDecomposition(0x41)).toBeNull();
  });
  it("knows the Unicode 18 additions", () => {
    expect(field(0x3d000, "Name")).toBe("SMALL SEAL CHARACTER-3D000");
    expect(field(0x3d000, "Script")).toBe("Seal");
    expect(field(0x3d000, "Age")).toBe("Unicode 18.0");
    expect(field(0x191a0, "Script")).toBe("Jurchen");
    expect(field(0x125a8, "Script")).toBe("Proto Cuneiform");
    expect(field(0x0378, "Category")).toBe("Cn Unassigned");
  });
  it("lists aliases and the detection result when known", () => {
    const f = describeCharacter({ cp: 0x200d, props, nameOf, aliases: ["ZWJ"], block: "General Punctuation", rendered: false });
    expect(f[1]).toEqual(["Aliases", "ZWJ"]);
    expect(f[f.length - 1]).toEqual(["Glyph", "no font found: block placeholder"]);
  });
});
