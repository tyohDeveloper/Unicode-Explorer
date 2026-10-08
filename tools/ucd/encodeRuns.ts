/**
 * Run-length encode a per-code-point property as a flat array of
 * [gap, length, valueIndex] triples (gap = code points skipped since the
 * previous run; skipped code points have no value, e.g. unassigned). Adjacent
 * ranges with the same value merge. Values are interned in first-seen order.
 * Decoded by src/properties/decodeRuns.ts.
 */
export interface EncodedRuns { values: string[]; runs: number[] }

export function encodeRuns(ranges: readonly (readonly [number, number, string])[]): EncodedRuns {
  const values: string[] = [];
  const triples: [number, number, number][] = [];
  let next = 0;
  for (const [start, end, value] of ranges) {
    let index = values.indexOf(value);
    if (index < 0) index = values.push(value) - 1;
    const last = triples[triples.length - 1];
    if (last && start === next && last[2] === index) last[1] += end - start + 1;
    else triples.push([start - next, end - start + 1, index]);
    next = end + 1;
  }
  return { values, runs: triples.flat() };
}
