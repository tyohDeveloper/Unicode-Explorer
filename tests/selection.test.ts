import { describe, expect, it } from "vitest";
import { collectCodePoints } from "../src/selection/collectCodePoints.js";
import { countAssigned } from "../src/selection/countAssigned.js";
import { filterByQuery } from "../src/selection/filterByQuery.js";
import { parseQuery } from "../src/selection/parseQuery.js";
import { chunkItems } from "../src/selection/chunkItems.js";
import { estimateChunkHeight } from "../src/selection/estimateChunkHeight.js";
import { aliasesOf } from "../src/ucd/aliasesOf.js";
import { groupByBlock } from "../src/selection/groupByBlock.js";
import { sortTableItems } from "../src/selection/sortTableItems.js";
import { listBlocks } from "../src/ucd/listBlocks.js";
import { nameOf } from "./ucdFixture.js";

const basicLatin = listBlocks().slice(0, 1);

describe("collectCodePoints", () => {
  it("yields 95 visible characters for Basic Latin, 128 with non-visible included", () => {
    expect(countAssigned(collectCodePoints(basicLatin, false))).toBe(95);
    expect(countAssigned(collectCodePoints(basicLatin, true))).toBe(128);
  });
  it("includes reserved code points as flagged items and never surrogates", () => {
    const greek = listBlocks().find((b) => b.name === "Greek and Coptic")!;
    const items = collectCodePoints([greek], false);
    expect(items.find((i) => i.cp === 0x378)).toEqual({ cp: 0x378, block: "Greek and Coptic", reserved: true });
    const surrogates = listBlocks().filter((b) => /Surrogates/.test(b.name));
    expect(collectCodePoints(surrogates, true)).toEqual([]);
  });
});

describe("filterByQuery / groupByBlock / sortTableItems", () => {
  const items = collectCodePoints(basicLatin, false);
  it("filters case-insensitively by name substring", () => {
    expect(filterByQuery(items, "TiLdE", nameOf, aliasesOf).map((i: { cp: number }) => i.cp)).toEqual([0x7e]);
    expect(filterByQuery(items, "", nameOf, aliasesOf)).toHaveLength(items.length);
  });
  it("groups by block preserving order", () => {
    expect([...groupByBlock(items).keys()]).toEqual(["Basic Latin"]);
  });
  it("sorts by name in code-unit order, stable, and reverses on dir -1", () => {
    const asc = sortTableItems(items, { col: "name", dir: 1 }, nameOf).map((i: { cp: number }) => nameOf(i.cp));
    expect(asc.slice(0, 2)).toEqual(["AMPERSAND", "APOSTROPHE"]);
    const desc = sortTableItems(items, { col: "name", dir: -1 }, nameOf).map((i: { cp: number }) => nameOf(i.cp));
    expect(desc[0]).toBe("VERTICAL LINE");
  });
});

describe("search (DAT-04)", () => {
  const latin1 = listBlocks().slice(0, 2);
  const general = listBlocks().find((b) => b.name === "General Punctuation")!;
  it("parses code points, literal characters and text", () => {
    expect(parseQuery("U+2603")).toEqual({ text: "", cp: 0x2603 });
    expect(parseQuery("0x41")).toEqual({ text: "", cp: 0x41 });
    expect(parseQuery("cafe")).toEqual({ text: "cafe", cp: 0xcafe });
    expect(parseQuery("\u2603")).toEqual({ text: "", cp: 0x2603 });
    expect(parseQuery("a")).toEqual({ text: "a", cp: 0xa });
    expect(parseQuery("  snow man ")).toEqual({ text: "snow man", cp: null });
    expect(parseQuery("U+110000")).toEqual({ text: "", cp: null });
  });
  it("matches names, formal aliases, code points and literal characters", () => {
    const items = collectCodePoints(latin1, true);
    expect(filterByQuery(items, "nbsp", nameOf, aliasesOf).map((i) => i.cp)).toEqual([0xa0]);
    expect(filterByQuery(items, "U+00E9", nameOf, aliasesOf).map((i) => i.cp)).toEqual([0xe9]);
    expect(filterByQuery(items, "\u00E9", nameOf, aliasesOf).map((i) => i.cp)).toEqual([0xe9]);
    expect(filterByQuery(collectCodePoints([general], true), "zwj", nameOf, aliasesOf).map((i) => i.cp)).toEqual([0x200d]);
  });
});

describe("chunkItems / estimateChunkHeight", () => {
  it("splits at the size limit and at block boundaries unless told otherwise", () => {
    const items = [...collectCodePoints(listBlocks().slice(0, 2), false)];
    const chunks = chunkItems(items, 64);
    expect(chunks.every((c) => c.items.every((i) => i.block === c.block))).toBe(true);
    expect(chunks.map((c) => c.items.length)).toEqual([64, 31, 64, 31]);
    expect(chunkItems(items, 100, false).map((c) => c.items.length)).toEqual([100, 90]);
  });
  it("estimates rows from container width", () => {
    expect(estimateChunkHeight(100, 1000, { width: 36, height: 36, gap: 2 })).toBe(4 * 38);
    expect(estimateChunkHeight(0, 1000, { width: 36, height: 36, gap: 2 })).toBe(0);
    expect(estimateChunkHeight(5, 10, { width: 36, height: 36, gap: 2 })).toBe(5 * 38);
  });
});
