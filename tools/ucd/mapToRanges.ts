/** Turn a code point → value map into sorted [start, end, value] ranges of equal consecutive values. */
export function mapToRanges(map: ReadonlyMap<number, string>): [number, number, string][] {
  const out: [number, number, string][] = [];
  for (const cp of [...map.keys()].sort((a, b) => a - b)) {
    const value = map.get(cp) as string;
    const last = out[out.length - 1];
    if (last && last[1] === cp - 1 && last[2] === value) last[1] = cp;
    else out.push([cp, cp, value]);
  }
  return out;
}
