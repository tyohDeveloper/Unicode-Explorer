/**
 * Reverse of tools/ucd/encodeNameMap.ts: lines of SHARED_LEN(base36)|SUFFIX|HEX_CP,
 * sorted by name so each line reuses a prefix of the previous name.
 */
export function decodeNameTable(text: string): Map<number, string> {
  const table = new Map<number, string>();
  let previous = "";
  for (const line of text.split("\n")) {
    if (!line) continue;
    const a = line.indexOf("|");
    const b = line.indexOf("|", a + 1);
    const name = previous.slice(0, parseInt(line.slice(0, a), 36)) + line.slice(a + 1, b);
    table.set(parseInt(line.slice(b + 1), 16), name);
    previous = name;
  }
  return table;
}
