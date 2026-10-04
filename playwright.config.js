import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(globalThis.process?.env?.CI),
  retries: globalThis.process?.env?.CI ? 2 : 0,
  reporter: globalThis.process?.env?.CI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
        ["allure-playwright", { resultsDir: "allure-results" }],
      ]
    : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run preview -- --configLoader runner --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !globalThis.process?.env?.CI,
    timeout: 30_000,
  },
});
