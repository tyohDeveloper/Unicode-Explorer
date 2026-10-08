import { expect, test, type Page } from "@playwright/test";
import { artifactUrl } from "./fixtures.js";

const active = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.cp ?? document.activeElement?.id ?? "");

test("all blocks paint quickly, materialise lazily, and finish detection in the background", async ({ page }) => {
  await page.goto(artifactUrl("standard"));
  await expect(page.getByTestId("text-status-blocks")).toHaveText("0 blocks selected");
  const started = Date.now();
  await page.getByTestId("button-sidebar-all").click();
  await expect(page.locator("#output [data-cp]").first()).toBeVisible();
  expect(Date.now() - started).toBeLessThan(3000); // 52 s at 2.0.0.0 (PRF-01, CP2-01); ~0.2 s measured
  const cells = await page.locator("#output [data-cp]").count();
  expect(cells).toBeLessThan(20_000); // only chunks near the viewport exist
  expect(await page.locator(".chunk-pending").count()).toBeGreaterThan(100);
  await expect(page.getByTestId("text-status-chars")).toHaveText(/^172,382 characters · [\d,]+ verified · [\d,]+ unverified$/, { timeout: 60_000 });
});

test("skip button, roving keyboard focus, and Enter inserts without leaving the grid", async ({ page }) => {
  await page.goto(`${artifactUrl("standard")}#b=0000,4E00`);
  await expect(page.getByTestId("button-grid-cell-0041")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("button-skip-output")).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await active(page)).toBe("0020");
  await page.keyboard.press("ArrowRight");
  expect(await active(page)).toBe("0021");
  await page.keyboard.press("End");
  expect(await active(page)).toBe("007E");
  await page.keyboard.press("ArrowRight");
  expect(await active(page)).toBe("4E00");
  await page.keyboard.press("End"); // last of 20,992 cells: its chunk is built on demand
  expect(await active(page)).toBe("9FFF");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("textarea-compose-pad")).toHaveValue("\u9FFF");
  expect(await active(page)).toBe("9FFF"); // UX-01: focus stays in the grid
});

test("mode and font selectors are keyboard reachable (ACC-01)", async ({ page }) => {
  await page.goto(artifactUrl("standard"));
  await page.getByTestId("radio-mode-grid").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("radio-mode-grid-cp")).toBeChecked();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#m=grid-cp");
  const display = await page.getByTestId("radio-font-serif").evaluate((el) => getComputedStyle(el).display);
  expect(display).not.toBe("none");
});

test("search accepts aliases, code points and literal characters (DAT-04)", async ({ page }) => {
  await page.goto(`${artifactUrl("standard")}#b=0000,0080,2000&nv=1`);
  const search = page.getByTestId("input-controls-namefilter");
  await search.fill("zwj");
  await expect(page.locator("#output [data-cp]")).toHaveCount(1);
  await expect(page.getByTestId("button-grid-cell-200D")).toBeVisible();
  await search.fill("U+00E9");
  await expect(page.locator("#output [data-cp]")).toHaveCount(1);
  await expect(page.getByTestId("button-grid-cell-00E9")).toBeVisible();
  await search.fill("\u00E9");
  await expect(page.getByTestId("button-grid-cell-00E9")).toBeVisible();
});

test("emoji presentation control and the non-sortable Ch column (GLY-06, UX-02)", async ({ page }) => {
  await page.goto(`${artifactUrl("standard")}#b=2600&m=table`);
  await expect(page.getByTestId("table-output-main")).toBeVisible();
  await expect(page.getByTestId("button-table-sort-cp")).toBeVisible();
  await expect(page.locator("[data-testid=button-table-sort-ch]")).toHaveCount(0);
  await page.getByTestId("select-controls-presentation").selectOption("text");
  await expect(page.locator("#output")).toHaveClass(/emoji-text/);
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#b=2600&m=table&e=text");
});
