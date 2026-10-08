/** Lower-case, hyphenated key for test IDs and hash values: "Latin & Extensions" → "latin-extensions". */
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
