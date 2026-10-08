/** Uppercase hex, at least four digits: 0x41 → "0041", 0x1F600 → "1F600". */
export function formatHex(cp: number): string {
  return cp.toString(16).toUpperCase().padStart(4, "0");
}
