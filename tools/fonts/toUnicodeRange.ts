/** Sorted code points → CSS unicode-range descriptor value ("U+0020-007E, U+00A0-..."). */
export function toUnicodeRange(sorted: readonly number[]): string {
  const parts: string[] = [];
  let start = -1;
  let prev = -2;
  const flush = () => { if (start >= 0) parts.push(start === prev ? `U+${hex(start)}` : `U+${hex(start)}-${hex(prev)}`); };
  for (const cp of sorted) {
    if (cp !== prev + 1) { flush(); start = cp; }
    prev = cp;
  }
  flush();
  return parts.join(", ");
}

function hex(cp: number): string {
  return cp.toString(16).toUpperCase().padStart(4, "0");
}
