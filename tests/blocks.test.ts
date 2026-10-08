import { describe, expect, it } from "vitest";
import { parseBlocks } from "../tools/ucd/parseBlocks.js";
import { readUcdFile } from "../tools/ucd/readUcdFile.js";
import { loadRuntime, repoRoot, unicodeVersion } from "./loadRuntime.js";

const rt = loadRuntime();
const official = parseBlocks(readUcdFile(repoRoot, unicodeVersion, "Blocks.txt"));

describe("BLOCKS", () => {
  it("has exactly the official blocks, in order, with official names and ranges", () => {
    expect(rt.BLOCKS.length).toBe(official.length);
    rt.BLOCKS.forEach(([name, start, end], i) => {
      expect({ name, start, end }).toEqual(official[i]);
    });
  });

  it("gives every block a non-empty category", () => {
    for (const [name, , , category] of rt.BLOCKS) {
      expect(category, name).toMatch(/\S/);
    }
  });
});
