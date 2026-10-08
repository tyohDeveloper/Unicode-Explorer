import { formatHex } from "./formatHex.js";

/** Standard notation: 0x41 → "U+0041". */
export function formatCodePoint(cp: number): string {
  return `U+${formatHex(cp)}`;
}
