import { defineConfig, devices } from "@playwright/test";

const productionUrl = process.env.PRODUCTION_URL;
if (!productionUrl) throw new Error("Set PRODUCTION_URL before running production smoke tests.");

export default defineConfig({
  testDir: "./e2e/production",
  fullyParallel: false,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: productionUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "production-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
