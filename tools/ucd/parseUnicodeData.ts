/**
 * Parse UnicodeData.txt into the set of assigned code points (ranges expanded)
 * and the map of individually named characters. Range markers
 * (<…, First>/<…, Last>) and bracketed labels (<control>) are not names; the
 * runtime derives those algorithmically or by category.
 */
export interface UnicodeData {
  assigned: Set<number>;
  nameMap: Map<number, string>;
  /** General_Category per assigned code point (ranges expanded). */
  categoryMap: Map<number, string>;
}

export function parseUnicodeData(text: string): UnicodeData {
  const assigned = new Set<number>();
  const nameMap = new Map<number, string>();
  const categoryMap = new Map<number, string>();
  let rangeFirst = -1;
  for (const line of text.split("\n")) {
    const fields = line.trim().split(";");
    if (fields.length < 2) continue;
    const cp = parseInt(fields[0], 16);
    const name = fields[1];
    const category = fields[2];
    if (name.endsWith(", First>")) { rangeFirst = cp; continue; }
    if (name.endsWith(", Last>")) {
      if (rangeFirst >= 0) for (let i = rangeFirst; i <= cp; i++) { assigned.add(i); categoryMap.set(i, category); }
      rangeFirst = -1;
      continue;
    }
    assigned.add(cp);
    categoryMap.set(cp, category);
    rangeFirst = -1;
    if (!name.startsWith("<")) nameMap.set(cp, name);
  }
  return { assigned, nameMap, categoryMap };
}
