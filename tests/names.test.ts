import { describe, expect, it } from "vitest";
import { loadRuntime, ucd } from "./loadRuntime.js";

const rt = loadRuntime();

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

describe("getCharName", () => {
  it("matches UnicodeData.txt for every assigned code point with a name", () => {
    let checked = 0;
    const mismatches: string[] = [];
    for (const cp of ucd.assigned) {
      const expected = expectedName(cp, ucd.nameMap.get(cp));
      if (expected === null) continue;
      checked++;
      const actual = rt.getCharName(cp);
      if (actual !== expected && mismatches.length < 10) mismatches.push(`U+${cp.toString(16)}: ${actual} != ${expected}`);
    }
    expect(mismatches).toEqual([]);
    expect(checked).toBeGreaterThan(150_000); // 40,470 named + CJK, Tangut, Hangul ranges;
  });

  it("derives Hangul syllable names at the block edges", () => {
    expect(rt.getCharName(0xac00)).toBe("HANGUL SYLLABLE GA");
    expect(rt.getCharName(0xac01)).toBe("HANGUL SYLLABLE GAG");
    expect(rt.getCharName(0xd7a3)).toBe("HANGUL SYLLABLE HIH");
  });

  it("labels characters without names by category", () => {
    expect(rt.getCharName(0x0000)).toBe("<control-0000>");
    expect(rt.getCharName(0x009f)).toBe("<control-009F>");
    expect(rt.getCharName(0xd800)).toBe("<surrogate-D800>");
    expect(rt.getCharName(0xe000)).toBe("<private-use-E000>");
    expect(rt.getCharName(0x10fffd)).toBe("<private-use-10FFFD>");
    expect(rt.getCharName(0xfdd0)).toBe("<noncharacter-FDD0>");
    expect(rt.getCharName(0x1fffe)).toBe("<noncharacter-1FFFE>");
    expect(rt.getCharName(0x0378)).toBe("U+0378");
  });
});

describe("code point helpers", () => {
  it("encodes supplementary code points as surrogate pairs", () => {
    expect(rt.cpToStr(0x41)).toBe("A");
    expect(rt.cpToStr(0x1f600)).toBe("\u{1F600}");
    expect(rt.cpToStr(0x10ffff)).toBe("\u{10FFFF}");
  });
  it("formats hex with at least four digits", () => {
    expect(rt.hex4(0x41)).toBe("0041");
    expect(rt.hex4(0x1f600)).toBe("1F600");
    expect(rt.cpHex(0x10ffff)).toBe("U+10FFFF");
  });
});
