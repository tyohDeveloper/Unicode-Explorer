export interface HexRange { start: string; end: string }
export interface NumericRange { start: number; end: number }

/** Authored JSON carries hex strings; the runtime wants numbers. */
export function parseHexRanges<T extends HexRange>(ranges: readonly T[]): (Omit<T, "start" | "end"> & NumericRange)[] {
  return ranges.map((r) => ({ ...r, start: parseInt(r.start, 16), end: parseInt(r.end, 16) }));
}
