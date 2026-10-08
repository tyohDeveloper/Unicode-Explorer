import { expect, test, type Page } from "@playwright/test";
import { artifactUrl, GHOST_PACK_BLOCK, TEST_PACK_BLOCK } from "./fixtures.js";

const resourceError = (text: string) => /Failed to load resource/.test(text);

async function openWithErrors(page: Page, url: string): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !resourceError(m.text())) errors.push(m.text()); });
  await page.goto(url);
  return errors;
}

test("a block no listed font covers is unverified; placeholders switch those cells to Last Resort", async ({ page }) => {
  await openWithErrors(page, `${artifactUrl("standard")}#b=${TEST_PACK_BLOCK}`);
  await expect(page.getByTestId("text-status-chars")).toHaveText("115 characters · 0 verified · 115 unverified");
  await expect(page.locator("#output .gc.unverified")).toHaveCount(115);
  await expect(page.locator(".block-sep-heading .block-coverage")).toHaveText(" · 0/115 verified");
  const cell = page.locator("#output .gc.unverified").first();
  const before = await cell.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(before).not.toContain("UE LastResort");
  await page.getByTestId("checkbox-controls-placeholders").check();
  await expect.poll(() => cell.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("UE LastResort");
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#b=${TEST_PACK_BLOCK}&p=1`);
  // The embedded placeholder font must really render (the Last Resort HE build loaded but drew nothing; PLAN D-11):
  // measured with Adobe Blank behind it, so system fallback cannot stand in.
  const ink = await page.evaluate(async () => {
    await document.fonts.load('32px "UE LastResort"');
    const c = document.createElement("canvas").getContext("2d")!;
    c.font = '32px "UE LastResort","UE Blank"';
    const m = c.measureText(String.fromCodePoint(0x18d80));
    return m.width > 1 && m.actualBoundingBoxAscent + m.actualBoundingBoxDescent > 1;
  });
  expect(ink).toBe(true);
});

test("combining marks are drawn on a dotted circle but insert bare", async ({ page }) => {
  await openWithErrors(page, `${artifactUrl("standard")}#b=0300`);
  const first = page.getByTestId("button-grid-cell-0300");
  await expect(first).toHaveText("\u25CC\u0300");
  await expect(first).toHaveClass(/cell-mark/);
  await first.click();
  await expect(page.getByTestId("textarea-compose-pad")).toHaveValue("\u0300");
});

test("non-visible characters show their Unicode abbreviation or kind", async ({ page }) => {
  await openWithErrors(page, `${artifactUrl("standard")}#b=2000&nv=1`);
  await expect(page.getByTestId("button-grid-cell-200D").locator(".hidden-label")).toHaveText("ZWJ");
  await expect(page.getByTestId("button-grid-cell-2028").locator(".hidden-label")).toHaveText("SEP");
  await expect(page.getByTestId("button-grid-cell-2028")).toHaveClass(/cell-hidden/);
});

test("font packs load from the sibling directory on demand and a missing pack fails softly", async ({ page }) => {
  const errors = await openWithErrors(page, `${artifactUrl("packs")}#b=${TEST_PACK_BLOCK},${GHOST_PACK_BLOCK}`);
  await expect(page.getByTestId("text-status-fonts")).toHaveText("Font packs: Test · Font pack unavailable: Ghost", { timeout: 20_000 });
  await expect(page.getByTestId("text-status-chars")).toHaveText(/· 0 unverified$|^698 characters · 698 verified$/);
  const headings = await page.locator(".block-sep-heading").allTextContents();
  expect(headings.find((h) => h.startsWith("Tangut Components Supplement"))).toContain("115 verified");
  expect(await page.evaluate(() => [...document.fonts].some((f) => f.family === "UE TestPack" && f.status === "loaded"))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--glyph-font"))).toContain("UE TestPack");
  expect(errors).toEqual([]);
});

test("the CJK locale selector sets lang on the output and the hash", async ({ page }) => {
  await openWithErrors(page, `${artifactUrl("standard")}#b=4E00`);
  await page.getByTestId("select-controls-lang").selectOption("ja");
  await expect(page.locator("#output")).toHaveAttribute("lang", "ja");
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#b=4E00&l=ja");
  await page.getByTestId("select-controls-lang").selectOption("");
  await expect(page.locator("#output")).not.toHaveAttribute("lang", /./);
});

test("the About dialog lists the embedded fonts, pack status, and license texts", async ({ page }) => {
  await openWithErrors(page, artifactUrl("standard"));
  await page.getByTestId("button-header-about").click();
  const dialog = page.getByTestId("dialog-about-main");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("table-about-fonts").locator("tbody tr")).toHaveCount(4);
  await expect(dialog.getByTestId("text-about-packs")).toContainText("No font packs found");
  await expect(dialog.locator("details")).toHaveCount(3);
  await expect(dialog.locator("details").first().locator("pre")).toContainText("SIL OPEN FONT LICENSE");
  await page.getByTestId("button-about-close").click();
  await expect(dialog).toBeHidden();
});
