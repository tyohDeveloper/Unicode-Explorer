export interface ParsedQuery { text: string; cp: number | null }

/**
 * The search box accepts a name or alias fragment, a code point ("U+1F600",
 * "0x1F600", "1F600"), or a literal character ("☃"). Hex-looking text is both
 * a code point and a name fragment ("CAFE" finds U+CAFE and CAFE-named characters).
 */
export function parseQuery(query: string): ParsedQuery {
  const text = query.trim();
  const hex = /^(?:u\+|0x)?([0-9a-f]{1,6})$/i.exec(text);
  if (hex) {
    const cp = parseInt(hex[1], 16);
    return { text: /^(u\+|0x)/i.test(text) ? "" : text.toLowerCase(), cp: cp <= 0x10ffff ? cp : null };
  }
  const chars = [...text];
  if (chars.length === 1 && !/^[a-z0-9 ]$/i.test(text)) return { text: "", cp: chars[0].codePointAt(0) ?? null };
  return { text: text.toLowerCase(), cp: null };
}
