import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composeFontStack } from "../src/fonts/composeFontStack.js";
import { isGenericFamily } from "../src/fonts/isGenericFamily.js";
import { splitFontFamilies } from "../src/fonts/splitFontFamilies.js";
import { addToCoverage } from "../src/coverage/addToCoverage.js";
import { sampleBlock } from "../src/coverage/sampleBlock.js";
import { blockOf } from "../src/ucd/blockOf.js";
import { packsForBlocks } from "../src/fonts/packsForBlocks.js";
import { packStatusText } from "../src/fonts/packStatusText.js";
import { standardFonts } from "../src/fonts/standardFonts.js";
import { summarizeCoverage } from "../src/coverage/summarizeCoverage.js";
import { coverageText } from "../src/coverage/coverageText.js";
import { displayForm } from "../src/ucd/displayForm.js";
import { toUnicodeRange } from "../tools/fonts/toUnicodeRange.js";
import { packBlocks } from "../tools/fonts/packBlocks.js";
import { packScript, packsManifestScript } from "../tools/fonts/packScripts.js";

import { readFontManifest } from "../tools/fonts/fontManifest.js";
import { repoRoot } from "./ucdFixture.js";
describe("composeFontStack", () => {
  it("orders style packs, style stack, device fonts, block packs, then embedded fonts; dedupes and quotes names with spaces", () => {
    expect(composeFontStack({ stylePacks: ["UE Charis"], style: ["system-ui", "serif"], device: ["Segoe UI Historic", "serif"], blockPacks: ["UE Tangut"], embedded: ["UE Unifont", "UE Unifont Upper"] }))
      .toBe('"UE Charis",system-ui,serif,"Segoe UI Historic","UE Tangut","UE Unifont","UE Unifont Upper"');
    expect(composeFontStack({ stylePacks: [], style: ["monospace"], device: [], blockPacks: [], embedded: ["UE Unifont"] })).toBe('monospace,"UE Unifont"');
  });
});

describe("splitFontFamilies / isGenericFamily", () => {
  it("parses quoted and bare names and recognises generic keywords", () => {
    expect(splitFontFamilies(`'Source Han Serif SC', "Noto Serif", Georgia,serif`)).toEqual(["Source Han Serif SC", "Noto Serif", "Georgia", "serif"]);
    expect(isGenericFamily("serif")).toBe(true);
    expect(isGenericFamily("System-UI")).toBe(true);
    expect(isGenericFamily("Georgia")).toBe(false);
  });
});

describe("packsForBlocks", () => {
  const packs = [
    { id: "tangut", label: "Tangut", file: "tangut.js", bytes: 1, families: ["UE Tangut"], blocks: ["17000", "18800"] },
    { id: "cuneiform", label: "Cuneiform", file: "cuneiform.js", bytes: 1, families: ["UE Cuneiform"], blocks: ["12000"] },
  ];
  it("selects packs whose blocks intersect the selection, in catalogue order", () => {
    expect(packsForBlocks(packs, [0x12000, 0x17000]).map((p) => p.id)).toEqual(["tangut", "cuneiform"]);
    expect(packsForBlocks(packs, [0x18800]).map((p) => p.id)).toEqual(["tangut"]);
    expect(packsForBlocks(packs, [0x0000])).toEqual([]);
  });
});

describe("packStatusText", () => {
  it("reports loading, loaded and unavailable packs in one line", () => {
    expect(packStatusText([])).toBe("");
    expect(packStatusText([{ id: "a", label: "Tangut", state: "loading", bytes: 1359916 }])).toBe("Loading font pack: Tangut (1.3 MB)\u2026");
    expect(packStatusText([
      { id: "a", label: "Tangut", state: "loaded", bytes: 1 }, { id: "b", label: "CJK B\u2013F", state: "loading", bytes: 17302074 }, { id: "c", label: "Ghost", state: "failed", bytes: 1 },
    ])).toBe("Loading font pack: CJK B\u2013F (17 MB)\u2026 \u00B7 Font packs: Tangut \u00B7 Font pack unavailable: Ghost");
  });
});

describe("pack size and subsetting (D-20)", () => {
  it("adds a unicode-range to subset pack fonts", () => {
    const script = packScript("p", [{ family: "UE X", format: "woff2", bytes: new Uint8Array([1, 2, 3]), range: "U+20000-2537F" }]);
    expect(script).toContain('"range":"U+20000-2537F"');
    expect(packScript("q", [{ family: "UE X", format: "woff2", bytes: new Uint8Array([1]) }])).not.toContain("range");
  });
  it("keeps every recorded pack under 8 MiB, and the split CJK packs attach to their blocks", () => {
    const m = readFontManifest(repoRoot);
    for (const p of m.packs) expect(p.bytes ?? 0, p.id).toBeLessThanOrEqual(8 * 1024 * 1024);
    const blocksOf = (id: string) => m.packs.find((p) => p.id === id)?.blocks;
    expect(blocksOf("cjk-ext-b-1")).toEqual(["20000"]);
    expect(blocksOf("cjk-ext-b-2")).toEqual(["20000"]);
    expect(blocksOf("cjk-ext-c-f")).toContain("2F800");
  });
});

describe("standardFonts", () => {
  it("exposes the embedded fonts by role from fonts/manifest.json", () => {
    const s = standardFonts();
    expect(s.coverage).toEqual(["UE Charis Latin", "UE Unifont", "UE Unifont Upper", "UE Fairfax HD"]);
    expect(s.placeholder).toBe("UE LastResort");
    expect(s.detection).toBe("UE Blank");
    expect(s.guaranteed).toBeGreaterThan(70000);
    expect(s.of).toBe(172382);
  });
});

describe("coverage", () => {
  const items = [
    { cp: 0x41, block: "Basic Latin", reserved: false }, { cp: 0x42, block: "Basic Latin", reserved: false },
    { cp: 0x17000, block: "Tangut", reserved: false }, { cp: 0x0378, block: "Greek", reserved: true }, { cp: 0x00, block: "Basic Latin", reserved: false },
  ];
  it("counts verified and unverified per block, skipping reserved and hidden items", () => {
    const summary = summarizeCoverage(items, (cp) => cp < 0x100, (cp) => cp === 0);
    expect(summary.verified).toBe(2);
    expect(summary.unverified).toBe(1);
    expect(summary.byBlock.get("Basic Latin")).toEqual({ verified: 2, unverified: 0 });
    expect(summary.byBlock.get("Tangut")).toEqual({ verified: 0, unverified: 1 });
    expect(coverageText(4, summary)).toBe("4 characters \u00B7 2 verified \u00B7 1 unverified");
    expect(coverageText(1, { verified: 1, unverified: 0, byBlock: new Map() })).toBe("1 character \u00B7 1 verified");
    expect(coverageText(3, { verified: 0, unverified: 0, byBlock: new Map() })).toBe("3 characters");
  });
});

describe("displayForm", () => {
  it("draws marks on a dotted circle, non-visible characters as labels, and everything else as itself", () => {
    expect(displayForm(0x41)).toEqual({ text: "A", kind: "glyph", char: "A" });
    expect(displayForm(0x301)).toEqual({ text: "\u25CC\u0301", kind: "mark", char: "\u0301" });
    expect(displayForm(0x200d)).toEqual({ text: "ZWJ", kind: "label", char: "\u200d" });
    expect(displayForm(0x1f600).kind).toBe("glyph");
  });
});

describe("tools/fonts", () => {
  it("toUnicodeRange merges runs and formats singles", () => {
    expect(toUnicodeRange([0x20, 0x21, 0x22, 0x41, 0x1f600, 0x1f601])).toBe("U+0020-0022, U+0041, U+1F600-1F601");
    expect(toUnicodeRange([])).toBe("");
  });

  it("packBlocks attaches a pack to blocks in its categories it covers at least a quarter of", () => {
    const blocks = [
      { name: "Latin", start: 0x0, end: 0x7f, category: "Latin & Extensions" },
      { name: "Tangut", start: 0x100, end: 0x10f, category: "East Asian" },
      { name: "Sparse", start: 0x200, end: 0x20f, category: "East Asian" },
    ];
    const visible = new Set<number>();
    for (let cp = 0; cp <= 0x20f; cp++) visible.add(cp);
    const cmap = new Set<number>([...Array.from({ length: 0x80 }, (_, i) => i), 0x100, 0x101, 0x102, 0x103, 0x200]);
    expect(packBlocks(blocks, ["East Asian"], cmap, visible)).toEqual(["0100"]);
    expect(packBlocks(blocks, ["Latin & Extensions", "East Asian"], cmap, visible)).toEqual(["0000", "0100"]);
  });

  it("pack scripts publish data under the documented globals and run no code", () => {
    const script = packScript("tangut", [{ family: "UE Tangut", format: "woff2", bytes: new Uint8Array([1, 2, 3]) }]);
    expect(script).toBe('window.UnicodeExplorerFontPackData=window.UnicodeExplorerFontPackData||{};window.UnicodeExplorerFontPackData["tangut"]={"id":"tangut","fonts":[{"family":"UE Tangut","format":"woff2","data":"AQID"}]};\n');
    const manifest = packsManifestScript({ schema: "unicode-explorer-font-packs/1", app: "2.0.0.0", unicode: "17.0.0", edition: "complete", packs: [] });
    expect(manifest).toBe('window.UnicodeExplorerFontPacks={"schema":"unicode-explorer-font-packs/1","app":"2.0.0.0","unicode":"17.0.0","edition":"complete","packs":[]};\n');
  });
});

describe("addToCoverage", () => {
  it("accumulates like summarizeCoverage", () => {
    const summary = { verified: 0, unverified: 0, byBlock: new Map<string, { verified: number; unverified: number }>() };
    addToCoverage(summary, "Latin", true); addToCoverage(summary, "Latin", false); addToCoverage(summary, "Tangut", false);
    expect(summary.verified).toBe(1);
    expect(summary.unverified).toBe(2);
    expect(summary.byBlock.get("Latin")).toEqual({ verified: 1, unverified: 1 });
  });
});

describe("blockOf / sampleBlock", () => {
  it("finds the block of a code point and samples only visible assigned characters", () => {
    expect(blockOf(0x41)?.name).toBe("Basic Latin");
    expect(blockOf(0x1f600)?.name).toBe("Emoticons");
    expect(blockOf(0x2fe0)).toBeNull(); // between blocks
    const greek = blockOf(0x391)!;
    const samples = sampleBlock(greek, 24);
    expect(samples.length).toBeGreaterThan(20);
    expect(samples).not.toContain(0x378); // reserved
    expect(samples[samples.length - 1]).toBe(0x3ff);
    expect(sampleBlock(blockOf(0x41)!, 4)).toEqual([0x20, 0x40, 0x60, 0x7e]);
  });
});

describe("outline packs (D-23, #16)", () => {
  const m = JSON.parse(readFileSync(resolve(__dirname, "../fonts/manifest.json"), "utf-8"));
  const packs = m.packs.filter((p: { id: string }) => p.id.startsWith("outline-"));
  const fonts = new Map(m.fonts.map((f: { id: string }) => [f.id, f]));
  it("ship in both Complete editions with planned blocks, under the D-20 limit", () => {
    expect(packs.length).toBeGreaterThan(0);
    for (const p of packs) {
      expect(p.attach).toBe("planned");
      expect(p.blocks.length).toBeGreaterThan(0);
      expect(p.bytes).toBeLessThanOrEqual(8 * 1024 * 1024);
      for (const e of ["complete", "complete-hieroglyphs"]) expect(m.editions.find((x: { id: string }) => x.id === e).packs).toContain(p.id);
    }
  });
  it("use pinned OFL outline fonts subset to whole blocks", () => {
    for (const id of packs.flatMap((p: { fonts: string[] }) => p.fonts)) {
      const f = fonts.get(id) as { design: string; license: string; source: { url: string; sha256: string }; subset: unknown[] };
      expect(f.design).toBe("outline");
      expect(f.license).toBe("OFL-1.1");
      expect(f.source.url).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/gh\/notofonts\/notofonts\.github\.io@[0-9a-f]{40}\//);
      expect(f.source.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(f.subset.length).toBeGreaterThan(0);
    }
  });
});
