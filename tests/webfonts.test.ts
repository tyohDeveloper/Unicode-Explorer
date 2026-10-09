import { describe, expect, it } from "vitest";
import { inflateRawSync } from "node:zlib";
import webFonts from "../data/web-fonts.json";
import { chooseWebFonts } from "../src/webfonts/chooseWebFonts.js";
import { blockSpansFor } from "../src/webfonts/blockSpansFor.js";
import { webFontCss, type WebFontFace } from "../src/webfonts/webFontCss.js";
import { deviceFontCss } from "../src/webfonts/deviceFontCss.js";
import { packsForStyle } from "../src/fonts/packsForStyle.js";

const ranges = JSON.parse(inflateRawSync(Buffer.from(webFonts.ranges, "base64")).toString("utf-8")) as Record<string, number[][]>;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

describe("data/web-fonts.json", () => {
  it("lists only pinned https URLs with licences, and measured ranges for every family in both orders", () => {
    for (const f of webFonts.fonts) {
      expect(f.url).toMatch(/^https:\/\//);
      expect(f.license).not.toBe("");
    }
    for (const family of [...webFonts.order.serif, ...webFonts.order.sans]) expect(ranges[family], family).toBeDefined();
    expect(webFonts.order.serif[0]).toBe("Charis");
    expect(webFonts.order.sans[0]).toBe("Andika");
  });
});

describe("chooseWebFonts", () => {
  const toy = { A: [[0x41, 0x5a]], B: [[0x41, 0x7a]], Big: [[0x100, 0x1ff]], Fallback: [[0x0, 0x2ff]] };
  it("keeps families in priority order only when they add coverage", () => {
    const c = chooseWebFonts(["A", "B", "Fallback"], toy, [0x41, 0x61, 0x2a0]);
    expect(c.chosen).toEqual([{ family: "A", gain: 1 }, { family: "B", gain: 1 }, { family: "Fallback", gain: 1 }]);
    expect(c.covered).toBe(3);
  });
  it("drops a large family whose characters other kept families already cover", () => {
    const c = chooseWebFonts(["A", "Big", "Fallback"], toy, [0x41, 0x150], { Big: 30_000_000, Fallback: 2_000_000, A: 100_000 });
    expect(c.chosen.map((x) => x.family)).toEqual(["A", "Fallback"]);
    expect(c.covered).toBe(2);
  });
  it("chooses Charis first and adds script fonts for a Latin + Hebrew selection with real data", () => {
    const c = chooseWebFonts(webFonts.order.serif, ranges, [...range(0x41, 0x5a), ...range(0x5d0, 0x5ea)]);
    expect(c.chosen[0].family).toBe("Charis");
    expect(c.chosen.map((x) => x.family)).toContain("Noto Serif Hebrew");
    expect(c.covered).toBe(c.total);
  });
});

describe("CSS text", () => {
  const faces: WebFontFace[] = [
    { family: "A", face: "Regular", weight: 400, style: "normal", url: "https://x/a.ttf", format: "truetype", bytes: 1048576, license: "OFL-1.1", license_url: "https://openfontlicense.org/" },
    { family: "A", face: "Bold", weight: 700, style: "normal", url: "https://x/a-b.ttf", format: "truetype", bytes: 1048576, license: "OFL-1.1", license_url: "https://openfontlicense.org/" },
  ];
  it("writes @font-face rules with block unicode-ranges and the stack, with coverage and size in a comment", () => {
    const css = webFontCss({ app: "9.9.9.9", blocks: ["Basic Latin"], choice: { chosen: [{ family: "A", gain: 26 }], covered: 26, total: 95 }, faces, spans: { A: [{ start: 0, end: 0x7f }] }, generic: "serif" });
    expect(css).toContain("Covers 26 of 95 visible characters (27.4%) with 1 web font family.");
    expect(css).toContain("File size, before any HTTP compression: 1.0 MB for the regular faces, 2.0 MB with bold and italic");
    expect(css).toContain('src: url("https://x/a-b.ttf") format("truetype");\n  font-weight: 700;');
    expect(css).toContain("unicode-range: U+0000-007F;");
    expect(css).toContain('font-family: "A", serif;');
  });
  it("blockSpansFor keeps only blocks where the family covers a selected character", () => {
    expect(blockSpansFor([[0x41, 0x5a]], [{ start: 0, end: 0x7f }, { start: 0x80, end: 0xff }], [0x41, 0xe9])).toEqual([{ start: 0, end: 0x7f }]);
  });
  it("labels the no-download form as device-specific", () => {
    const css = deviceFontCss({ app: "9.9.9.9", families: ["Noto Sans Thai", "system-ui"], verified: 50, total: 100, done: true, generic: "sans-serif" });
    expect(css).toContain("THIS device");
    expect(css).toContain("50 of 100 visible characters (50.0%)");
    expect(css).toContain('font-family: "Noto Sans Thai", system-ui, sans-serif;');
  });
});

describe("packsForStyle", () => {
  const packs = [
    { id: "serif", label: "", file: "", bytes: 1, families: [], blocks: [], kind: "style" as const, styles: ["serif"], faces: "regular" as const },
    { id: "symbols", label: "", file: "", bytes: 1, families: [], blocks: [], kind: "style" as const, styles: ["serif", "sans-serif"], faces: "regular" as const },
    { id: "serif-styles", label: "", file: "", bytes: 1, families: [], blocks: [], kind: "style" as const, styles: ["serif"], faces: "styled" as const },
    { id: "tangut", label: "", file: "", bytes: 1, families: [], blocks: ["17000"] },
  ];
  it("serves regular faces for the button and styled faces only when bold or italic is on", () => {
    expect(packsForStyle(packs, "serif", false).map((p) => p.id)).toEqual(["serif", "symbols"]);
    expect(packsForStyle(packs, "serif", true).map((p) => p.id)).toEqual(["serif", "symbols", "serif-styles"]);
    expect(packsForStyle(packs, "monospace", true)).toEqual([]);
  });
});

import { selfHostCss } from "../src/webfonts/selfHostCss.js";

describe("self-host template (Q-14 option B)", () => {
  const fonts = [
    { family: "Unifont", key: "self-host:unifont", file: "unifont-18.0.01.otf", download: "https://www.unifoundry.com/a.otf", format: "opentype", version: "18.0.01", license: "OFL-1.1", license_url: "https://unifoundry.com/LICENSE.txt" },
    { family: "Unifont", key: "self-host:unifont_upper", file: "unifont_upper-18.0.01.otf", download: "https://www.unifoundry.com/b.otf", format: "opentype", version: "18.0.01", license: "OFL-1.1", license_url: "https://unifoundry.com/LICENSE.txt" },
  ];
  const ranges = { "self-host:unifont": [[0x0, 0xffff], [0x10d40]], "self-host:unifont_upper": [[0x10d40, 0x10d65]] };
  it("writes a commented rule per file, each character once, never pointing at this app", () => {
    const css = selfHostCss({ uncovered: [0x10d40, 0x10d41, 0x10d42, 0x3d000], fonts, ranges });
    expect(css).toContain("4 selected characters have no public web font. GNU Unifont 18.0.01 covers 3 of them");
    expect(css).toContain(" *   unicode-range: U+10D40;");
    expect(css).toContain(" *   unicode-range: U+10D41-10D42;");
    expect(css).toContain("Download: https://www.unifoundry.com/b.otf");
    expect(css.match(/\*\//g)).toHaveLength(1);
    expect(css).not.toMatch(/unicode-fonts|jsdelivr.net\/gh\/tyohDeveloper/);
  });
  it("is empty when nothing is left or Unifont does not cover it", () => {
    expect(selfHostCss({ uncovered: [], fonts, ranges })).toBe("");
    expect(selfHostCss({ uncovered: [0x3d000], fonts, ranges })).toBe("");
  });
});
