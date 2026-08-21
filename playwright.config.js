import { defineConfig, devices } from "@playwright/test";

const isContinuousIntegration = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isContinuousIntegration,
  retries: isContinuousIntegration ? 2 : 0,
  workers: 1,
  reporter: isContinuousIntegration ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm node:local",
      reuseExistingServer: !isContinuousIntegration,
      stderr: "pipe",
      stdout: "ignore",
      timeout: 120_000,
      url: "http://127.0.0.1:8545",
    },
    {
      command: "pnpm deploy:localhost && pnpm dev",
      reuseExistingServer: !isContinuousIntegration,
      stderr: "pipe",
      stdout: "ignore",
      timeout: 180_000,
      url: "http://127.0.0.1:3000",
    },
  ],
});
