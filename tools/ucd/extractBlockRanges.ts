/**
 * Pull [start, end] pairs out of unicode-src/data/blocks.js. The block list is
 * still hand-maintained JS (PLAN.md Phase 6 generates it); until then this is
 * the one place that reads it, and tests/blocks.test.ts holds it equal to the
 * vendored Blocks.txt.
 */
export function extractBlockRanges(blocksJs: string): [number, number][] {
  const ranges: [number, number][] = [];
  const re = /\[\s*"[^"]*"\s*,\s*(0x[0-9A-Fa-f]+|\d+)\s*,\s*(0x[0-9A-Fa-f]+|\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blocksJs)) !== null) {
    const start = Number(m[1]);
    const end = Number(m[2]);
    if (Number.isFinite(start) && Number.isFinite(end) && start <= end) ranges.push([start, end]);
  }
  return ranges;
}
