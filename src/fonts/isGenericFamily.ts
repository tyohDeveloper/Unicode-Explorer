const GENERIC = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "math", "fangsong", "emoji", "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded"]);

/** CSS generic family keywords always resolve to some font, so they are never pruned. */
export function isGenericFamily(name: string): boolean {
  return GENERIC.has(name.toLowerCase());
}
