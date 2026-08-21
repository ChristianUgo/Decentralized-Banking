import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { installInjectedWallet } from "./support/injected-wallet.js";

const routes = ["/", "/dashboard", "/deposit", "/borrow", "/repay", "/liquidity"];

test.beforeEach(async ({ page }) => {
  await installInjectedWallet(page);
});

for (const route of routes) {
  test(`${route} has no automated WCAG A or AA violations`, async ({ page }) => {
    const browserErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    await page.goto(route);
    await page.locator("main").waitFor();
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
    expect((await page.locator("body").innerText()).trim().length).toBeGreaterThan(100);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(browserErrors).toEqual([]);
    expect(results.violations).toEqual([]);
  });
}

test("banking routes remain free of horizontal overflow on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  for (const route of routes) {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${route} horizontal overflow`).toBeLessThanOrEqual(1);
  }
});
