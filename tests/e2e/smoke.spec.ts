import { expect, test, type Page } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const artifact = pathToFileURL(resolve(import.meta.dirname, "../../Unicode.html")).href;

async function open(page: Page): Promise<{ requests: string[]; errors: string[] }> {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => { if (!r.url().startsWith("file:")) requests.push(r.url()); });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(artifact);
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
  await page.locator("#blk-0").check();
  await expect(page.getByTestId("text-status-blocks")).toHaveText("1 block selected");
  await expect(page.getByTestId("text-status-chars")).toHaveText("95 characters");
  await page.locator("#output .gc").filter({ hasText: /^A$/ }).click();
  await expect(page.getByTestId("textarea-compose-pad")).toHaveValue("A");
});

test("name filter narrows the output and table mode shows names", async ({ page }) => {
  await open(page);
  await page.locator("#blk-0").check();
  await page.getByTestId("input-controls-namefilter").fill("tilde");
  await expect(page.getByTestId("text-status-chars")).toHaveText("1 character");
  // The radio itself is display:none (audit ACC-01, Phase 5); users click the label.
  await page.locator("label", { has: page.getByTestId("radio-mode-table") }).click();
  await expect(page.locator("#output td.td-name")).toHaveText(["TILDE"]);
});

test("include non-visible reveals control characters", async ({ page }) => {
  await open(page);
  await page.locator("#blk-0").check();
  await page.getByTestId("checkbox-controls-nonvisible").check();
  await expect(page.getByTestId("text-status-chars")).toHaveText("128 characters");
});

test("CSP blocks a runtime fetch attempt", async ({ page }) => {
  await open(page);
  const blocked = await page.evaluate(() => fetch("https://example.com/").then(() => false).catch(() => true));
  expect(blocked).toBe(true);
});
