/** Read a UCD `XXXX..YYYY ; Value # comment` file (Scripts.txt, DerivedAge.txt) into [start, end, value] triples. */
export function parseRangeValues(text: string): [number, number, string][] {
  const out: [number, number, string][] = [];
  for (const line of text.split("\n")) {
    const m = /^([0-9A-F]{4,6})(?:\.\.([0-9A-F]{4,6}))?\s*;\s*([^#\s][^#]*?)\s*(?:#|$)/.exec(line);
    if (m) out.push([parseInt(m[1], 16), parseInt(m[2] ?? m[1], 16), m[3]]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}
