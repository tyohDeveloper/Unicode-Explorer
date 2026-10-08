import { describe, expect, it } from "vitest";
import { collectCodePoints } from "../src/selection/collectCodePoints.js";
import { countAssigned } from "../src/selection/countAssigned.js";
import { filterByName } from "../src/selection/filterByName.js";
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

describe("filterByName / groupByBlock / sortTableItems", () => {
  const items = collectCodePoints(basicLatin, false);
  it("filters case-insensitively by name substring", () => {
    expect(filterByName(items, "TiLdE", nameOf).map((i) => i.cp)).toEqual([0x7e]);
    expect(filterByName(items, "", nameOf)).toHaveLength(items.length);
  });
  it("groups by block preserving order", () => {
    expect([...groupByBlock(items).keys()]).toEqual(["Basic Latin"]);
  });
  it("sorts by name in code-unit order, stable, and reverses on dir -1", () => {
    const asc = sortTableItems(items, { col: "name", dir: 1 }, nameOf).map((i) => nameOf(i.cp));
    expect(asc.slice(0, 2)).toEqual(["AMPERSAND", "APOSTROPHE"]);
    const desc = sortTableItems(items, { col: "name", dir: -1 }, nameOf).map((i) => nameOf(i.cp));
    expect(desc[0]).toBe("VERTICAL LINE");
  });
});
