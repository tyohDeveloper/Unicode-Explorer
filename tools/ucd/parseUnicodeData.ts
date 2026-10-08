/**
 * Parse UnicodeData.txt into the set of assigned code points (ranges expanded),
 * the map of individually named characters, and General_Category per code
 * point. Range markers (<…, First>/<…, Last>) and bracketed labels (<control>)
 * are not names; the runtime derives those algorithmically or by category.
 */
export interface UnicodeData {
  assigned: Set<number>;
  nameMap: Map<number, string>;
  /** General_Category per assigned code point (ranges expanded). */
  categoryMap: Map<number, string>;
}

function assignRange(data: UnicodeData, first: number, last: number, category: string): void {
  for (let cp = first; cp <= last; cp++) {
    data.assigned.add(cp);
    data.categoryMap.set(cp, category);
  }
}

export function parseUnicodeData(text: string): UnicodeData {
  const data: UnicodeData = { assigned: new Set(), nameMap: new Map(), categoryMap: new Map() };
  let rangeFirst = -1;
  for (const line of text.split("\n")) {
    const fields = line.trim().split(";");
    if (fields.length < 3) continue;
    const cp = parseInt(fields[0], 16);
    const name = fields[1];
    if (name.endsWith(", First>")) { rangeFirst = cp; continue; }
    if (name.endsWith(", Last>")) {
      if (rangeFirst >= 0) assignRange(data, rangeFirst, cp, fields[2]);
      rangeFirst = -1;
      continue;
    }
    assignRange(data, cp, cp, fields[2]);
    rangeFirst = -1;
    if (!name.startsWith("<")) data.nameMap.set(cp, name);
  }
  return data;
}
