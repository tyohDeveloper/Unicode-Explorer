/** NameAliases.txt → every formal alias per code point (correction, control, alternate, figment, abbreviation), in file order. */
export function parseAllAliases(text: string): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const raw of text.split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [cp, alias] = line.split(";");
    const code = parseInt(cp, 16);
    const list = map.get(code);
    if (list) list.push(alias); else map.set(code, [alias]);
  }
  return map;
}
