import { expect, test } from "@playwright/test";
import { artifactUrl } from "./fixtures.js";

test("Unicode 18: the Seal block lists 11,328 characters with derived names and a placeholder (DAT-01, D-18)", async ({ page }) => {
  await page.goto(`${artifactUrl("standard")}#b=3D000`);
  await expect(page.getByTestId("text-status-chars")).toHaveText(/^11,328 characters · /);
  await expect(page.getByTestId("button-grid-cell-3D000")).toHaveAttribute("aria-label", "U+3D000 SMALL SEAL CHARACTER-3D000");
  await expect(page.getByTestId("button-grid-cell-3D000")).toHaveClass(/unverified/);
});

test("details strip follows hover and keyboard focus; click still inserts (D-19, DAT-05)", async ({ page }) => {
  await page.goto(`${artifactUrl("standard")}#b=0080,1DB00`);
  await page.getByTestId("button-grid-cell-00E9").hover();
  await expect(page.getByTestId("text-details-cp")).toHaveText("U+00E9");
  await expect(page.getByTestId("text-details-decomposition")).toHaveText("canonical: U+0065 LATIN SMALL LETTER E + U+0301 COMBINING ACUTE ACCENT");
  await expect(page.getByTestId("text-details-age")).toHaveText("Unicode 1.1");
  await page.getByTestId("button-grid-cell-00E9").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("text-details-name")).toHaveText("LATIN SMALL LETTER E WITH CIRCUMFLEX");
  await expect(page.getByTestId("panel-details-main")).toHaveAttribute("aria-live", "polite");
  await page.getByTestId("button-grid-cell-1DB00").scrollIntoViewIfNeeded();
  await page.getByTestId("button-grid-cell-1DB00").hover();
  await expect(page.getByTestId("text-details-script")).toHaveText("Common");
  await expect(page.getByTestId("text-details-age")).toHaveText("Unicode 18.0");
  await page.getByTestId("button-grid-cell-00E9").click();
  await expect(page.getByTestId("textarea-compose-pad")).toHaveValue(/é$/);
});

test("Latin Extended-G is fully drawn by the embedded fonts, including the Unicode 18 additions (#14)", async ({ page }) => {
  await page.goto(`${artifactUrl("standard")}#b=1DF00`);
  await expect(page.getByTestId("text-status-chars")).toHaveText("188 characters · 188 verified", { timeout: 30_000 });
});

test("the details strip names the drawing font: outline Charis, bitmap Fairfax HD (D-22, D-24, #16)", async ({ page }) => {
  await page.goto(`${artifactUrl("standard")}#b=1DF00`);
  await expect(page.getByTestId("text-status-chars")).toHaveText("188 characters · 188 verified", { timeout: 30_000 });
  await page.getByTestId("button-grid-cell-1DF12").hover();
  await expect(page.getByTestId("text-details-glyph")).toHaveText("Charis (outline, embedded)");
  await page.getByTestId("button-grid-cell-1DFCD").hover();
  await expect(page.getByTestId("text-details-glyph")).toHaveText("Fairfax HD (bitmap, embedded)");
});

test("the details strip calls a generic family the browser's choice, not an installed font (CP4-02)", async ({ page }) => {
  await page.goto(`${artifactUrl("standard")}#b=0000`);
  await page.getByTestId("button-grid-cell-0041").hover();
  await expect(page.getByTestId("text-details-glyph")).toHaveText(/^the browser's (system-ui|serif) font \(a generic family/);
});
