import { describe, expect, it } from "vitest";
import stacks from "../data/font-stacks.json";
import { splitFontFamilies } from "../src/fonts/splitFontFamilies.js";

const CJK = /CJK|Source Han|Song|Kai|KaiTi|Hei|Ming|YaHei|JhengHei|Hiragino|Meiryo|Malgun|Sarasa|MS Gothic|NSimSun|FangSong|SimFang|cwTeX|^kai$|^Noto (Serif|Sans) (SC|TC|HK|JP|KR)$|Heisei/;
const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|fangsong|math|system-ui)$/;

describe("data/font-stacks.json (GLY-03)", () => {
  for (const f of stacks.fonts) {
    const families = splitFontFamilies(f.stack).filter((x) => !GENERIC.test(x));
    it(`${f.id}: Latin families before CJK ones, no unsuffixed CJK collection names`, () => {
      const firstCjk = families.findIndex((x) => CJK.test(x));
      const lastLatin = families.map((x) => CJK.test(x)).lastIndexOf(false);
      if (firstCjk >= 0 && lastLatin >= 0) expect(lastLatin, families.join(", ")).toBeLessThan(firstCjk);
      for (const x of families) expect(x).not.toMatch(/^Noto (Serif|Sans|Sans Mono) CJK$/);
    });
  }
});
