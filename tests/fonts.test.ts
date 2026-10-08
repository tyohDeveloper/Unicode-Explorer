import { describe, expect, it } from "vitest";
import { composeFontStack } from "../src/fonts/composeFontStack.js";
import { packsForBlocks } from "../src/fonts/packsForBlocks.js";
import { packStatusText } from "../src/fonts/packStatusText.js";
import { standardFonts } from "../src/fonts/standardFonts.js";
import { summarizeCoverage } from "../src/coverage/summarizeCoverage.js";
import { coverageText } from "../src/coverage/coverageText.js";
import { displayForm } from "../src/ucd/displayForm.js";
import { toUnicodeRange } from "../tools/fonts/toUnicodeRange.js";
import { packBlocks } from "../tools/fonts/packBlocks.js";
import { packScript, packsManifestScript } from "../tools/fonts/packScripts.js";

describe("composeFontStack", () => {
  it("orders style stack, device fonts, packs, then embedded fonts and quotes names with spaces", () => {
    expect(composeFontStack("system-ui,serif", ["Segoe UI Historic"], ["UE Tangut"], ["UE Unifont", "UE Unifont Upper"]))
      .toBe('system-ui,serif,"Segoe UI Historic","UE Tangut","UE Unifont","UE Unifont Upper"');
    expect(composeFontStack("monospace", [], [], ["UE Unifont"])).toBe('monospace,"UE Unifont"');
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

describe("standardFonts", () => {
  it("exposes the embedded fonts by role from fonts/manifest.json", () => {
    const s = standardFonts();
    expect(s.coverage).toEqual(["UE Unifont", "UE Unifont Upper"]);
    expect(s.placeholder).toBe("UE LastResort");
    expect(s.detection).toBe("UE Blank");
    expect(s.guaranteed).toBeGreaterThan(70000);
    expect(s.of).toBe(159375);
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
