import { expect, test } from "@playwright/test";
import { artifactUrl } from "./fixtures.js";

test("Serif loads its style pack first in the stack; Bold adds the styled faces only when switched on (D-14, Q-11)", async ({ page }) => {
  await page.goto(`${artifactUrl("packs")}#b=0000`);
  await expect(page.getByTestId("button-grid-cell-0041")).toBeVisible();
  await page.locator("label", { has: page.getByTestId("radio-font-serif") }).click();
  await expect(page.getByTestId("text-status-fonts")).toContainText("Test serif");
  await expect(page.getByTestId("text-status-fonts")).not.toContainText("Test serif bold");
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--glyph-font"))).toMatch(/^"UE TestSerif",/);
  await page.getByTestId("checkbox-controls-bold").check();
  await expect(page.getByTestId("text-status-fonts")).toContainText("Test serif bold");
  expect(await page.evaluate(() => [...document.fonts].some((f) => f.family === "UE TestSerif" && f.weight === "700" && f.status === "loaded"))).toBe(true);
  expect(await page.getByTestId("button-grid-cell-0041").locator(".glyph").evaluate((el) => getComputedStyle(el).fontWeight)).toBe("700");
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#b=0000&f=serif&bold=1");
  await page.getByTestId("checkbox-controls-nosynth").check();
  await expect(page.locator("#output")).toHaveClass(/no-synthesis/);
});

test("CSS for this selection writes web-font CSS from public URLs and a device form, without any request", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => { if (!r.url().startsWith("file:")) requests.push(r.url()); });
  await page.goto(`${artifactUrl("standard")}#b=0000,0590`);
  await expect(page.getByTestId("button-grid-cell-0041")).toBeVisible();
  await page.getByTestId("button-controls-css").click();
  const web = page.getByTestId("text-css-web");
  await expect(web).toHaveValue(/Covers [\d,]+ of [\d,]+ visible characters \(100\.0%\)/);
  await expect(web).toHaveValue(/font-family: "Charis", "Noto Serif Hebrew"[^;]*, serif;/);
  await expect(web).toHaveValue(/src: url\("https:\/\/cdn\.jsdelivr\.net\/gh\/silnrsi\/font-charis@[0-9a-f]{40}\//);
  await expect(page.getByTestId("text-css-device")).toHaveValue(/THIS device[\s\S]*Rendered here by these fonts: [\d,]+ of/);
  await page.getByTestId("radio-css-sans").check();
  await expect(web).toHaveValue(/font-family: "Andika"/);
  await page.getByTestId("button-css-close").click();
  await expect(page.getByTestId("dialog-css-main")).toBeHidden();
  expect(requests).toEqual([]);
});
