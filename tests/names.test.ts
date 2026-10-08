import { describe, expect, it } from "vitest";
import { codePointToString } from "../src/codepoint/codePointToString.js";
import { formatCodePoint } from "../src/codepoint/formatCodePoint.js";
import { formatHex } from "../src/codepoint/formatHex.js";
import { nameOf, nameTable, repoRoot, ucd, unicodeVersion } from "./ucdFixture.js";

const HANGUL_L = ["G","GG","N","D","DD","R","M","B","BB","S","SS","","J","JJ","C","K","T","P","H"];
const HANGUL_V = ["A","AE","YA","YAE","EO","E","YEO","YE","O","WA","WAE","OE","YO","U","WEO","WE","WI","YU","EU","YI","I"];
const HANGUL_T = ["","G","GG","GS","N","NJ","NH","D","L","LG","LM","LB","LS","LT","LP","LH","M","B","BS","S","SS","NG","J","C","K","T","P","H"];

/** Expected name per The Unicode Standard §4.8 for an assigned code point, or null when it has no character name. */
function expectedName(cp: number, label: string | undefined): string | null {
  if (label !== undefined) return label.startsWith("<") ? null : label;
  const hex = cp.toString(16).toUpperCase().padStart(4, "0");
  if ((cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x20000 && cp <= 0x3347f)) return `CJK UNIFIED IDEOGRAPH-${hex}`;
  if ((cp >= 0x17000 && cp <= 0x187ff) || (cp >= 0x18d00 && cp <= 0x18d7f)) return `TANGUT IDEOGRAPH-${hex}`;
  if (cp >= 0xac00 && cp <= 0xd7a3) {
    const s = cp - 0xac00;
    return `HANGUL SYLLABLE ${HANGUL_L[Math.floor(s / 588)]}${HANGUL_V[Math.floor((s % 588) / 28)]}${HANGUL_T[s % 28]}`;
  }
  return null;
}

import { algorithmicName } from "../src/ucd/algorithmicName.js";
import { readUcdFile } from "../tools/ucd/readUcdFile.js";
describe("resolveCharName", () => {
  it("decodes the embedded table to exactly the UnicodeData names outside the DerivedName prefix ranges (D-18)", () => {
    const stored = [...ucd.nameMap].filter(([cp]) => algorithmicName(cp) === null);
    expect(nameTable.size).toBe(stored.length);
    for (const [cp, name] of stored) if (nameTable.get(cp) !== name) throw new Error(`U+${cp.toString(16)}: ${nameTable.get(cp)} != ${name}`);
  });

  it("resolves every name listed in DerivedName.txt exactly (172,808 characters in Unicode 18)", () => {
    let checked = 0;
    for (const line of readUcdFile(repoRoot, unicodeVersion, "DerivedName.txt").split("\n")) {
      const m = /^([0-9A-F]{4,6})(?:\.\.([0-9A-F]{4,6}))?\s*;\s*(.+)$/.exec(line.trim());
      if (!m) continue;
      for (let cp = parseInt(m[1], 16); cp <= parseInt(m[2] ?? m[1], 16); cp++, checked++) {
        const want = m[3].endsWith("*") ? m[3].slice(0, -1) + cp.toString(16).toUpperCase().padStart(4, "0") : m[3];
        if (nameOf(cp) !== want) throw new Error(`U+${cp.toString(16)}: ${nameOf(cp)} != ${want}`);
      }
    }
    expect(checked).toBe(unicodeVersion === "18.0.0" ? 172808 : checked);
  });

  it("matches UnicodeData.txt for every assigned code point with a name", () => {
    let checked = 0;
    const mismatches: string[] = [];
    for (const cp of ucd.assigned) {
      const expected = expectedName(cp, ucd.nameMap.get(cp));
      if (expected === null) continue;
      checked++;
      const actual = nameOf(cp);
      if (actual !== expected && mismatches.length < 10) mismatches.push(`U+${cp.toString(16)}: ${actual} != ${expected}`);
    }
    expect(mismatches).toEqual([]);
    expect(checked).toBeGreaterThan(150_000); // 40,470 named + CJK, Tangut, Hangul ranges;
  });

  it("derives Hangul syllable names at the block edges", () => {
    expect(nameOf(0xac00)).toBe("HANGUL SYLLABLE GA");
    expect(nameOf(0xac01)).toBe("HANGUL SYLLABLE GAG");
    expect(nameOf(0xd7a3)).toBe("HANGUL SYLLABLE HIH");
  });

  it("labels characters without names by category", () => {
    expect(nameOf(0x0000)).toBe("<control-0000>");
    expect(nameOf(0x009f)).toBe("<control-009F>");
    expect(nameOf(0xd800)).toBe("<surrogate-D800>");
    expect(nameOf(0xe000)).toBe("<private-use-E000>");
    expect(nameOf(0x10fffd)).toBe("<private-use-10FFFD>");
    expect(nameOf(0xfdd0)).toBe("<noncharacter-FDD0>");
    expect(nameOf(0x1fffe)).toBe("<noncharacter-1FFFE>");
    expect(nameOf(0x0378)).toBe("U+0378");
  });
});

describe("code point helpers", () => {
  it("encodes supplementary code points as surrogate pairs", () => {
    expect(codePointToString(0x41)).toBe("A");
    expect(codePointToString(0x1f600)).toBe("\u{1F600}");
    expect(codePointToString(0x10ffff)).toBe("\u{10FFFF}");
  });
  it("formats hex with at least four digits", () => {
    expect(formatHex(0x41)).toBe("0041");
    expect(formatHex(0x1f600)).toBe("1F600");
    expect(formatCodePoint(0x10ffff)).toBe("U+10FFFF");
  });
});
