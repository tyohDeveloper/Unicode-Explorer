/**
 * Parse NameAliases.txt into the first `abbreviation`-type alias per code
 * point (e.g. 00AD → "SHY", 200D → "ZWJ"). Used to label non-visible characters.
 */
export function parseNameAliases(text: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const raw of text.split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [cp, alias, type] = line.split(";");
    if (type !== "abbreviation") continue;
    const code = parseInt(cp, 16);
    if (!map.has(code)) map.set(code, alias);
  }
  return map;
}
