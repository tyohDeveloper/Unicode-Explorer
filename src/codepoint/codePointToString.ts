/** Scalar value → string (supplementary code points become a surrogate pair). */
export function codePointToString(cp: number): string {
  return String.fromCodePoint(cp);
}
