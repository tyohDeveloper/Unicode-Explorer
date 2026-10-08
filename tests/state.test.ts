import { describe, expect, it } from "vitest";
import { decodeHashState } from "../src/state/decodeHashState.js";
import { encodeHashState } from "../src/state/encodeHashState.js";
import { initialSettings } from "../src/state/settings.js";
import { hydrateSettings, setBlocks, setManyBlocks, setMode, setNameFilter, setSize, toggleBlock, toggleTableSort } from "../src/state/settingsActions.js";
import { settingsReducer } from "../src/state/settingsReducer.js";

describe("settingsReducer", () => {
  it("keeps blocks sorted and unique", () => {
    let s = settingsReducer(initialSettings, setBlocks([0x400, 0, 0x400]));
    expect(s.blocks).toEqual([0, 0x400]);
    s = settingsReducer(s, toggleBlock(0x80));
    s = settingsReducer(s, toggleBlock(0));
    expect(s.blocks).toEqual([0x80, 0x400]);
    s = settingsReducer(s, setManyBlocks([0x80, 0x400], false));
    expect(s.blocks).toEqual([]);
  });
  it("resets the table sort when the selection, mode, or filter changes", () => {
    let s = settingsReducer(initialSettings, toggleTableSort("name"));
    expect(s.tableSort).toEqual({ col: "name", dir: 1 });
    s = settingsReducer(s, toggleTableSort("name"));
    expect(s.tableSort).toEqual({ col: "name", dir: -1 });
    expect(settingsReducer(s, setMode("table")).tableSort).toBeNull();
    expect(settingsReducer(s, setNameFilter("a")).tableSort).toBeNull();
    expect(settingsReducer(s, toggleBlock(0)).tableSort).toBeNull();
  });
  it("clamps size to the slider range", () => {
    expect(settingsReducer(initialSettings, setSize(4)).size).toBe(10);
    expect(settingsReducer(initialSettings, setSize(99)).size).toBe(48);
    expect(settingsReducer(initialSettings, hydrateSettings({ size: 24.4 })).size).toBe(24);
  });
});

describe("hash state", () => {
  it("round-trips every field and omits defaults", () => {
    const s = { ...initialSettings, blocks: [0, 0x370], mode: "table" as const, font: "serif", size: 24, nonVisible: true, nameFilter: "snow flake" };
    const hash = encodeHashState(s);
    expect(hash).toBe("b=0000,0370&m=table&f=serif&s=24&nv=1&q=snow%20flake");
    expect(decodeHashState("#" + hash)).toEqual({ blocks: [0, 0x370], mode: "table", font: "serif", size: 24, nonVisible: true, nameFilter: "snow flake" });
    expect(encodeHashState(initialSettings)).toBe("");
  });
  it("ignores malformed values", () => {
    expect(decodeHashState("#b=zz,0041&m=bogus&s=abc&x=1")).toEqual({ blocks: [0x41] });
  });
});

describe("Phase 4 settings in the hash", () => {
  it("round-trips placeholders and the CJK locale", () => {
    const s = { ...initialSettings, placeholders: true, lang: "zh-Hant" };
    expect(encodeHashState(s)).toBe("p=1&l=zh-Hant");
    expect(decodeHashState("#p=1&l=zh-Hant")).toEqual({ placeholders: true, lang: "zh-Hant" });
    expect(decodeHashState("#l=<script>")).toEqual({});
  });
});

describe("Phase 5 settings in the hash", () => {
  it("round-trips emoji presentation, bold, italic and no-synthesis", () => {
    const s = { ...initialSettings, presentation: "text" as const, bold: true, italic: true, noSynthesis: true };
    expect(encodeHashState(s)).toBe("e=text&bold=1&italic=1&nosynth=1");
    expect(decodeHashState("#e=text&bold=1&italic=1&nosynth=1")).toEqual({ presentation: "text", bold: true, italic: true, noSynthesis: true });
    expect(decodeHashState("#e=sparkly")).toEqual({});
  });
});
