/** Parse Blocks.txt into ordered [name, start, end] entries. */
export interface UcdBlock { name: string; start: number; end: number }

export function parseBlocks(text: string): UcdBlock[] {
  const out: UcdBlock[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [range, name] = line.split(";");
    const [a, b] = range.split("..");
    out.push({ name: name.trim(), start: parseInt(a, 16), end: parseInt(b, 16) });
  }
  return out;
}
