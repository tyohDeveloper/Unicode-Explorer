import { describe, expect, it } from "vitest";
import { isNonVisible } from "../src/ucd/isNonVisible.js";
import { hiddenLabel } from "../src/ucd/hiddenLabel.js";
import { isCombiningMark } from "../src/ucd/isCombiningMark.js";
import { parsePropertyRanges } from "../tools/ucd/parsePropertyRanges.js";
import { readUcdFile } from "../tools/ucd/readUcdFile.js";
import { repoRoot, ucd, unicodeVersion } from "./ucdFixture.js";

describe("isNonVisible", () => {
  it("hides controls, surrogates, private use, noncharacters, and format ranges", () => {
    for (const cp of [0x00, 0x1f, 0x7f, 0x9f, 0xd800, 0xdfff, 0xe000, 0xf8ff, 0xfeff, 0xfdd0, 0xfffe, 0x1ffff, 0x200b, 0x200f, 0x202e, 0x2060, 0x206f, 0xfe00, 0xfe0f, 0xe0001, 0xe01ef, 0xf0000, 0x10ffff]) {
      expect(isNonVisible(cp), `U+${cp.toString(16)}`).toBe(true);
    }
  });

  it("shows ordinary graphic characters", () => {
    for (const cp of [0x20, 0x41, 0xe9, 0x4e00, 0x1f600, 0x10400]) {
      expect(isNonVisible(cp), `U+${cp.toString(16)}`).toBe(false);
    }
  });

  it("hides default-ignorable and format characters that v1 showed (audit DAT-02 fixed)", () => {
    for (const cp of [0x00ad, 0x034f, 0x061c, 0x115f, 0x1160, 0x180e, 0x2028, 0x2029, 0x13430, 0x1d173]) {
      expect(isNonVisible(cp), `U+${cp.toString(16)}`).toBe(true);
    }
  });

  it("keeps Prepended_Concatenation_Mark characters visible although they are Cf", () => {
    for (const cp of [0x0600, 0x0605, 0x06dd, 0x070f, 0x0890, 0x08e2, 0x110bd, 0x110cd]) {
      expect(isNonVisible(cp), `U+${cp.toString(16)}`).toBe(false);
    }
  });

  it("hides exactly the property-defined set over every assigned code point", () => {
    const invisibleCategories = new Set(["Cc", "Cf", "Cs", "Co", "Zl", "Zp"]);
    const ignorable = parsePropertyRanges(readUcdFile(repoRoot, unicodeVersion, "DerivedCoreProperties.txt"), "Default_Ignorable_Code_Point");
    const prepended = parsePropertyRanges(readUcdFile(repoRoot, unicodeVersion, "PropList.txt"), "Prepended_Concatenation_Mark");
    const inRanges = (cp: number, ranges: [number, number][]) => ranges.some(([s, e]) => cp >= s && cp <= e);
    const wrong: string[] = [];
    for (const [cp, category] of ucd.categoryMap) {
      const expected = !inRanges(cp, prepended) && (invisibleCategories.has(category) || inRanges(cp, ignorable));
      if (isNonVisible(cp) !== expected && wrong.length < 10) wrong.push(`U+${cp.toString(16)} ${category} ${ucd.nameMap.get(cp) ?? ""}`);
    }
    expect(wrong).toEqual([]);
  });
});

describe("hiddenLabel and isCombiningMark", () => {
  it("labels non-visible characters by Unicode abbreviation, else by kind", () => {
    expect(hiddenLabel(0x00ad)).toBe("SHY");
    expect(hiddenLabel(0x200d)).toBe("ZWJ");
    expect(hiddenLabel(0xfe0f)).toBe("VS16");
    expect(hiddenLabel(0xe000)).toBe("PUA");
    expect(hiddenLabel(0xfffe)).toBe("NCHR");
    expect(hiddenLabel(0x2028)).toBe("SEP"); // no abbreviation alias exists for LINE SEPARATOR
    expect(hiddenLabel(0x41)).toBeNull();
  });

  it("recognises combining marks (Mn, Mc, Me) and nothing else", () => {
    expect(isCombiningMark(0x0301)).toBe(true);
    expect(isCombiningMark(0x093e)).toBe(true); // Mc
    expect(isCombiningMark(0x20dd)).toBe(true); // Me
    expect(isCombiningMark(0x41)).toBe(false);
    expect(isCombiningMark(0x25cc)).toBe(false);
    let wrong = 0;
    for (const [cp, gc] of ucd.categoryMap) if (isCombiningMark(cp) !== (gc === "Mn" || gc === "Mc" || gc === "Me")) wrong++;
    expect(wrong).toBe(0);
  });
});
