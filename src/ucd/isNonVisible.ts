import { hiddenKind } from "./hiddenKind.js";

/** True for code points that produce no visible glyph; hidden unless "Include non-visible". */
export function isNonVisible(cp: number): boolean {
  return hiddenKind(cp) !== null;
}
