/** Sorted run arrays for binary search. */
export interface DecodedRuns { starts: number[]; ends: number[]; index: number[] }

/** Expand tools/ucd/encodeRuns.ts output ([gap, length, valueIndex] triples) into sorted run arrays. */
export function decodeRuns(runs: readonly number[]): DecodedRuns {
  const out: DecodedRuns = { starts: [], ends: [], index: [] };
  let next = 0;
  for (let i = 0; i + 2 < runs.length; i += 3) {
    const start = next + runs[i];
    out.starts.push(start);
    out.ends.push(start + runs[i + 1] - 1);
    out.index.push(runs[i + 2]);
    next = start + runs[i + 1];
  }
  return out;
}
