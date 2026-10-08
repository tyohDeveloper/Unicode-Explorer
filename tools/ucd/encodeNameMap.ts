/**
 * Delta-encode the name map: sort by name so neighbours share prefixes, then
 * write SHARED_LEN(base36)|SUFFIX|HEX_CP per line. The runtime decoder in
 * serializeNameMap.ts reverses this exactly.
 */
export function encodeNameMap(nameMap: Map<number, string>): string {
  const sorted = [...nameMap.entries()].sort((a, b) =>
    a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[0] - b[0],
  );
  let prev = "";
  const lines = sorted.map(([cp, name]) => {
    let shared = 0;
    const minLen = Math.min(prev.length, name.length);
    while (shared < minLen && prev[shared] === name[shared]) shared++;
    const line = `${shared.toString(36)}|${name.slice(shared)}|${cp.toString(16)}`;
    prev = name;
    return line;
  });
  return lines.join("\n");
}
