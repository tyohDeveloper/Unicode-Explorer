/** U+FDD0..U+FDEF and the last two code points of every plane. */
export function isNoncharacter(cp: number): boolean {
  return (cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xffff) >= 0xfffe;
}
