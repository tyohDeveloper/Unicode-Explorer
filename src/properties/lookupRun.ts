import type { DecodedRuns } from "./decodeRuns.js";

/** Value index of the run containing cp, or -1 when no run covers it (binary search). */
export function lookupRun(runs: DecodedRuns, cp: number): number {
  let lo = 0;
  let hi = runs.starts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cp < runs.starts[mid]) hi = mid - 1;
    else if (cp > runs.ends[mid]) lo = mid + 1;
    else return runs.index[mid];
  }
  return -1;
}
