/** Short → long value names for one property in PropertyValueAliases.txt (e.g. gc: Lu → Uppercase_Letter; sc: Seal → Seal). */
export function parseValueAliases(text: string, property: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of text.split("\n")) {
    const fields = line.split("#")[0].split(";").map((f) => f.trim());
    if (fields[0] === property && fields.length >= 3) map.set(fields[1], fields[2]);
  }
  return map;
}
