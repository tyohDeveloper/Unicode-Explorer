import { describe, expect, it } from "vitest";
import { parseBlocks } from "../tools/ucd/parseBlocks.js";
import { readUcdFile } from "../tools/ucd/readUcdFile.js";
import { listBlocks } from "../src/ucd/listBlocks.js";
import { repoRoot, unicodeVersion } from "./ucdFixture.js";

const official = parseBlocks(readUcdFile(repoRoot, unicodeVersion, "Blocks.txt"));

describe("listBlocks", () => {
  it("has exactly the official blocks, in order, with official names and ranges", () => {
    const blocks = listBlocks();
    expect(blocks.length).toBe(official.length);
    blocks.forEach(({ name, start, end }, i) => {
      expect({ name, start, end }).toEqual(official[i]);
    });
  });

  it("gives every block a non-empty category and keeps the first category Latin", () => {
    for (const { name, category } of listBlocks()) expect(category, name).toMatch(/\S/);
    expect(listBlocks()[0].category).toBe("Latin & Extensions");
  });
});
