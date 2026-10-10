/**
 * The output pane's font-family list (PLAN.md D-6, D-14): style-pack families
 * first (deliberate, known faces), then the chosen device style stack, then
 * device fonts known to carry rarer scripts, then the embedded outline fonts
 * (Charis Latin, D-28), then block packs, then the embedded bitmap fonts. Callers pass only families present on this device
 * (generic keywords always count as present). Placeholder and detection fonts
 * are never part of it.
 */
export interface StackParts { stylePacks: readonly string[]; style: readonly string[]; device: readonly string[]; blockPacks: readonly string[]; embedded: readonly string[]; embeddedOutline?: readonly string[] }

export function composeFontStack(parts: StackParts): string {
  const quote = (name: string) => (/^[A-Za-z-]+$/.test(name) ? name : `"${name.replace(/"/g, "")}"`);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of [...parts.stylePacks, ...parts.style, ...parts.device, ...(parts.embeddedOutline ?? []), ...parts.blockPacks, ...parts.embedded]) {
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(quote(name));
  }
  return out.join(",");
}
