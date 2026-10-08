/**
 * Code points that produce no visible glyph, derived from Unicode properties
 * (audit DAT-02): General_Category Cc, Cf, Cs, Co, Zl, Zp; Default_Ignorable_Code_Point;
 * and noncharacters. Prepended_Concatenation_Mark characters (Cf, but drawn)
 * stay visible. Output is sorted, merged [start, end, kind] runs.
 */
export type HiddenKind = "cc" | "cf" | "cs" | "co" | "z" | "di" | "nc";
export type HiddenRun = [number, number, HiddenKind];

const byCategory: Record<string, HiddenKind> = { Cc: "cc", Cf: "cf", Cs: "cs", Co: "co", Zl: "z", Zp: "z" };

function inRanges(cp: number, ranges: readonly [number, number][]): boolean {
  return ranges.some(([s, e]) => cp >= s && cp <= e);
}

function kindOf(cp: number, category: string | undefined, ignorable: boolean): HiddenKind | null {
  if ((cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe) return "nc";
  if (category && byCategory[category]) return byCategory[category];
  return ignorable ? "di" : null;
}

function pushRun(runs: HiddenRun[], cp: number, kind: HiddenKind): void {
  const last = runs[runs.length - 1];
  if (last && last[2] === kind && last[1] === cp - 1) last[1] = cp;
  else runs.push([cp, cp, kind]);
}

export function buildVisibility(
  categoryMap: ReadonlyMap<number, string>,
  defaultIgnorable: readonly [number, number][],
  prepended: readonly [number, number][],
): HiddenRun[] {
  const runs: HiddenRun[] = [];
  for (let cp = 0; cp <= 0x10ffff; cp++) {
    if (inRanges(cp, prepended)) continue;
    const kind = kindOf(cp, categoryMap.get(cp), inRanges(cp, defaultIgnorable));
    if (kind) pushRun(runs, cp, kind);
  }
  return runs;
}
