import { expect, test, type Page } from "@playwright/test";
import { artifactUrl } from "./fixtures.js";

/* The Standard edition has no unicode-fonts/ beside it; the browser logs that one missing sibling script. */
const expectedResourceError = (text: string) => /Failed to load resource/.test(text);

async function open(page: Page, hash = ""): Promise<{ requests: string[]; errors: string[] }> {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => { if (!r.url().startsWith("file:")) requests.push(r.url()); });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !expectedResourceError(m.text())) errors.push(m.text()); });
  await page.goto(artifactUrl("standard") + hash);
  return { requests, errors };
}

test("loads from file:// with zero network requests and no errors", async ({ page }) => {
  const { requests, errors } = await open(page);
  await expect(page).toHaveTitle("Unicode Character Explorer");
  await expect(page.getByTestId("text-header-version")).toHaveText(/^v\d+\.\d+\.\d+\.\d+$/);
  await page.getByTestId("button-sidebar-all").click();
  await page.waitForTimeout(300);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("selecting Basic Latin renders 95 characters and inserts into the composition pad", async ({ page }) => {
  await open(page);
  await page.getByTestId("checkbox-sidebar-block-0000").click();
  await expect(page.getByTestId("text-status-blocks")).toHaveText("1 block selected");
  await expect(page.getByTestId("text-status-chars")).toHaveText(/^95 characters · 9[45] verified/);
  await page.locator("#output .gc").filter({ hasText: /^A$/ }).click();
  await expect(page.getByTestId("textarea-compose-pad")).toHaveValue("A");
});

test("name filter narrows the output and table mode shows names", async ({ page }) => {
  await open(page);
  await page.getByTestId("checkbox-sidebar-block-0000").click();
  await page.getByTestId("input-controls-namefilter").fill("tilde");
  await expect(page.getByTestId("text-status-chars")).toHaveText(/^1 character · 1 verified$/);
  // The radio itself is display:none (audit ACC-01, Phase 5); users click the label.
  await page.locator("label", { has: page.getByTestId("radio-mode-table") }).click();
  await expect(page.locator("#output td.td-name")).toHaveText(["TILDE"]);
});

test("include non-visible reveals control characters", async ({ page }) => {
  await open(page);
  await page.getByTestId("checkbox-sidebar-block-0000").click();
  await page.getByTestId("checkbox-controls-nonvisible").check();
  await expect(page.getByTestId("text-status-chars")).toHaveText(/^128 characters · 9[45] verified/);
  // Controls are drawn as labelled boxes, never as blank cells (Phase 4).
  await expect(page.locator("#output .hidden-label").first()).toHaveText("NUL");
});

test("CSP blocks a runtime fetch attempt", async ({ page }) => {
  await open(page);
  const blocked = await page.evaluate(() => fetch("https://example.com/").then(() => false).catch(() => true));
  expect(blocked).toBe(true);
});

test("URL hash restores selection, mode, font, and size, and tracks changes", async ({ page }) => {
  await page.goto(artifactUrl("standard") + "#b=0370&m=grid-name&f=serif&s=30");
  await expect(page.getByTestId("text-status-blocks")).toHaveText("1 block selected");
  await expect(page.locator("#output .gcn").first()).toBeVisible();
  await expect(page.getByTestId("radio-font-serif")).toBeChecked();
  expect(await page.locator("#output").evaluate((el) => (el as HTMLElement).style.fontSize)).toBe("30px");
  await page.getByTestId("checkbox-sidebar-category-cyrillic").click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#b=0370,0400,0500,1C80,2DE0,A640,1E030&m=grid-name&f=serif&s=30");
});

test("category checkbox selects its blocks and table headers sort", async ({ page }) => {
  await open(page);
  await page.getByTestId("checkbox-sidebar-category-latin-extensions").click();
  await expect(page.getByTestId("text-status-blocks")).toHaveText("10 blocks selected");
  await page.getByTestId("input-controls-namefilter").fill("LATIN SMALL LETTER A");
  // The filter is debounced (150 ms); wait for it to land before sorting, or the sort would be reset.
  await expect.poll(async () => Number((await page.getByTestId("text-status-chars").textContent())?.split(" ")[0]?.replace(/,/g, ""))).toBeLessThan(200);
  await page.locator("label", { has: page.getByTestId("radio-mode-table") }).click();
  await page.getByTestId("button-table-sort-name").click();
  await expect(page.getByTestId("button-table-sort-name")).toHaveText(/Name \u25B2/);
  await expect(page.locator("#output td.td-name").first()).toHaveText("LATIN SMALL LETTER A");
  await page.getByTestId("button-table-sort-name").click();
  await expect(page.getByTestId("button-table-sort-name")).toHaveText(/Name \u25BC/);
});
