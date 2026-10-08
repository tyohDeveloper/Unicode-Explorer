import { describe, expect, it } from "vitest";
import unassigned from "../src/data/unassigned.json";
import { isReserved } from "../src/ucd/isReserved.js";
import { listBlocks } from "../src/ucd/listBlocks.js";
import { ucd } from "./ucdFixture.js";

describe("isReserved", () => {
  it("is true exactly for unassigned code points inside blocks (outside skipped categories)", () => {
    const skipped = (cp: number) =>
      (cp >= 0xd800 && cp <= 0xdfff) || (cp >= 0xe000 && cp <= 0xf8ff) || cp >= 0xf0000 ||
      (cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xffff) >= 0xfffe;
    const wrong: string[] = [];
    for (const { start, end } of listBlocks()) {
      for (let cp = start; cp <= end; cp++) {
        if (skipped(cp)) continue;
        const expected = !ucd.assigned.has(cp);
        if (isReserved(cp) !== expected && wrong.length < 10) wrong.push(`U+${cp.toString(16)} expected ${expected}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("keeps UNASSIGNED sorted and non-overlapping so binary search is valid", () => {
    let prevEnd = -1;
    for (const r of unassigned.ranges) {
      const start = r[0];
      const end = r.length > 1 ? r[1] : r[0];
      expect(start).toBeGreaterThan(prevEnd);
      expect(end).toBeGreaterThanOrEqual(start);
      prevEnd = end;
    }
  });

  it("treats code points outside every block as not reserved", () => {
    expect(isReserved(0x2fe0)).toBe(false); // gap between blocks
  });
});
