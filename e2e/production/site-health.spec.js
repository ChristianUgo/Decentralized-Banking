import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/dashboard", "/deposit", "/borrow", "/repay", "/liquidity"];

test("serves the verified Sepolia release health contract", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.ok()).toBe(true);
  const health = await response.json();
  expect(health).toMatchObject({ chainId: 11155111, network: "sepolia", status: "ok" });
  if (process.env.EXPECTED_COMMIT_SHA) {
    expect(health.release).toBe(process.env.EXPECTED_COMMIT_SHA);
  }
});

for (const route of routes) {
  test(`${route} is healthy in production`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
    });

    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle(/Aegis Bank/);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
    expect((await page.locator("body").innerText()).trim().length).toBeGreaterThan(100);

    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}
