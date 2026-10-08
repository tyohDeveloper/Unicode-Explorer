import visibility from "../data/visibility.json";

export type HiddenKind = "cc" | "cf" | "cs" | "co" | "z" | "di" | "nc";

const runs = visibility.hidden as [number, number, HiddenKind][];

/**
 * Why a code point produces no visible glyph (generated from General_Category,
 * Default_Ignorable_Code_Point, and the noncharacter rule), or null when it is
 * an ordinary visible character. Binary search over sorted runs.
 */
export function hiddenKind(cp: number): HiddenKind | null {
  let lo = 0;
  let hi = runs.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, end, kind] = runs[mid];
    if (cp < start) hi = mid - 1;
    else if (cp > end) lo = mid + 1;
    else return kind;
  }
  return null;
}
