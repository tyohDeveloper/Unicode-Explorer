/** Emit the UNASSIGNED JS table: [start,end] pairs, single points as [n]. */
export function serializeUnassigned(ranges: [number, number][]): string {
  if (ranges.length === 0) return "var UNASSIGNED=[];";
  const entries = ranges.map(([s, e]) => (s === e ? `[${s}]` : `[${s},${e}]`));
  const lines: string[] = [];
  let line = "";
  for (const entry of entries) {
    const sep = line ? "," : "";
    if (line.length + sep.length + entry.length > 118) { lines.push(line + ","); line = entry; }
    else line += sep + entry;
  }
  if (line) lines.push(line);
  return `var UNASSIGNED=[\n${lines.join("\n")}\n];`;
}
