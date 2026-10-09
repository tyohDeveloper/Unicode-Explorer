import { expect, test } from "@playwright/test";
import { artifactUrl } from "./fixtures.js";

/** The font Chromium actually used for a cell's glyph (DevTools CSS.getPlatformFontsForNode). */
async function usedFonts(page: import("@playwright/test").Page, hex: string): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: `[data-cp="${hex}"] .glyph` });
  const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  return fonts.map((f: { familyName: string }) => f.familyName);
}

test("Standard edition, Serif and Sans: Latin letters use a Latin family, not a CJK font's Latin (GLY-03)", async ({ page }) => {
  for (const font of ["serif", "sans-serif"]) {
    await page.goto(`${artifactUrl("standard")}#b=0000,4E00&f=${font}`);
    await expect(page.getByTestId("button-grid-cell-0041")).toBeVisible();
    const latin = await usedFonts(page, "0041");
    expect(latin.join(", ")).not.toMatch(/CJK|Source Han|Hei|Song|Ming/);
  }
});
