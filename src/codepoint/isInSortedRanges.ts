/**
 * Binary search over sorted, non-overlapping ranges. A range is [start, end]
 * or a single point [start]. O(log n) per lookup.
 */
export function isInSortedRanges(cp: number, ranges: readonly (readonly number[])[]): boolean {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const r = ranges[mid];
    const end = r.length > 1 ? r[1] : r[0];
    if (cp < r[0]) hi = mid - 1;
    else if (cp > end) lo = mid + 1;
    else return true;
  }
  return false;
}
