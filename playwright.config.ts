import { defineConfig } from "@playwright/test";

/* E2E runs against the built artifact over file://, never a dev server (ARCHITECTURE §7). */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 60_000,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: { browserName: "chromium", viewport: { width: 1400, height: 900 } },
});
