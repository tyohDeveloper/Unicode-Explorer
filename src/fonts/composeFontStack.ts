/**
 * The output pane's font-family list (PLAN.md D-6, fonts/manifest.json
 * stack_rule): the chosen style stack, then device fonts known to carry rarer
 * scripts, then any loaded sidecar packs, then the embedded coverage fonts.
 * Placeholder and detection fonts are never part of it.
 */
export function composeFontStack(styleStack: string, deviceFonts: readonly string[], packFamilies: readonly string[], embedded: readonly string[]): string {
  const quote = (name: string) => (/^[A-Za-z-]+$/.test(name) ? name : `"${name.replace(/"/g, "")}"`);
  const rest = [...deviceFonts, ...packFamilies, ...embedded].map(quote);
  return [styleStack.trim(), ...rest].filter(Boolean).join(",");
}
