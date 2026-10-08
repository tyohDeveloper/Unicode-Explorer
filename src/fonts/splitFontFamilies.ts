/** CSS font-family list → family names, unquoted, in order ("'A B',C, serif" → ["A B","C","serif"]). */
export function splitFontFamilies(stack: string): string[] {
  const names: string[] = [];
  for (const raw of stack.split(",")) {
    const name = raw.trim().replace(/^["']|["']$/g, "").trim();
    if (name) names.push(name);
  }
  return names;
}
