import { describe, expect, it } from "vitest";
import { loadRuntime, ucd } from "./loadRuntime.js";

const rt = loadRuntime();

describe("isNonVisible", () => {
  it("hides controls, surrogates, private use, noncharacters, and format ranges", () => {
    for (const cp of [0x00, 0x1f, 0x7f, 0x9f, 0xd800, 0xdfff, 0xe000, 0xf8ff, 0xfeff, 0xfdd0, 0xfffe, 0x1ffff, 0x200b, 0x200f, 0x202e, 0x2060, 0x206f, 0xfe00, 0xfe0f, 0xe0001, 0xe01ef, 0xf0000, 0x10ffff]) {
      expect(rt.isNonVisible(cp), `U+${cp.toString(16)}`).toBe(true);
    }
  });

  it("shows ordinary graphic characters", () => {
    for (const cp of [0x20, 0x41, 0xe9, 0x4e00, 0x1f600, 0x10400]) {
      expect(rt.isNonVisible(cp), `U+${cp.toString(16)}`).toBe(false);
    }
  });

  /*
   * Known gaps still gaps (audit GLY-04 / DAT-02). These characters are format
   * or default-ignorable yet shown by default today. Phase 4 derives visibility
   * from Unicode properties; update this list in the same commit that fixes it.
   */
  it("still shows these invisible characters by default (known gap)", () => {
    const knownShown = [0x00ad, 0x034f, 0x061c, 0x115f, 0x1160, 0x180e, 0x2028, 0x2029, 0x0600, 0x110bd, 0x13430, 0x1d173];
    for (const cp of knownShown) expect(rt.isNonVisible(cp), `U+${cp.toString(16)}`).toBe(false);
  });

  it("never hides an assigned graphic character (General Category outside Cc/Cf/Cs/Co/Zl/Zp)", () => {
    const invisibleCategories = new Set(["Cc", "Cf", "Cs", "Co", "Zl", "Zp"]);
    // Variation selectors are Mn but Default_Ignorable; hiding them is correct.
    // Phase 4 vendors DerivedCoreProperties.txt and tests the property directly.
    const variationSelector = (cp: number) => (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef);
    const hiddenGraphic: string[] = [];
    for (const [cp, category] of ucd.categoryMap) {
      if (rt.isNonVisible(cp) && !invisibleCategories.has(category) && !variationSelector(cp) && hiddenGraphic.length < 10) {
        hiddenGraphic.push(`U+${cp.toString(16)} ${category} ${ucd.nameMap.get(cp) ?? ""}`);
      }
    }
    expect(hiddenGraphic).toEqual([]);
  });
});
