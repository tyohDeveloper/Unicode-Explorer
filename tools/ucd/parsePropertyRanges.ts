/**
 * Parse one binary property out of a UCD property file (PropList.txt,
 * DerivedCoreProperties.txt): lines of `XXXX[..YYYY] ; Property # comment`.
 * Returns sorted, inclusive [start, end] ranges.
 */
export function parsePropertyRanges(text: string, property: string): [number, number][] {
  const ranges: [number, number][] = [];
  for (const raw of text.split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [cps, prop] = line.split(";").map((s) => s.trim());
    if (prop !== property) continue;
    const [first, last] = cps.split("..");
    ranges.push([parseInt(first, 16), parseInt(last ?? first, 16)]);
  }
  return ranges.sort((a, b) => a[0] - b[0]);
}
