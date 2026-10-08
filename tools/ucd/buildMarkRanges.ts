/**
 * Sorted, merged ranges of combining marks (General_Category Mn, Mc, Me).
 * The views draw these on a dotted circle (U+25CC) so the mark has a base.
 */
export function buildMarkRanges(categoryMap: ReadonlyMap<number, string>): [number, number][] {
  const ranges: [number, number][] = [];
  const cps = [...categoryMap.entries()].filter(([, gc]) => gc === "Mn" || gc === "Mc" || gc === "Me").map(([cp]) => cp).sort((a, b) => a - b);
  for (const cp of cps) {
    const last = ranges[ranges.length - 1];
    if (last && last[1] === cp - 1) last[1] = cp;
    else ranges.push([cp, cp]);
  }
  return ranges;
}
