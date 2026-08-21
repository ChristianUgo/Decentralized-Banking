import { expect, test } from "@playwright/test";

import { connectWallet, installInjectedWallet } from "./support/injected-wallet.js";

test.setTimeout(120_000);

async function completeAction(page, { amount, label, path }) {
  await page.goto(path);
  await expect(page.getByLabel(`${label} amount`)).toBeEnabled();
  await page.getByLabel(`${label} amount`).fill(amount);
  await page.getByRole("button", { name: `Review ${label.toLowerCase()}` }).click();
  await expect(page.getByRole("heading", { name: "Final transaction review" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("status", { name: "Confirmed on-chain" })).toBeVisible({
    timeout: 30_000,
  });
}

test.beforeEach(async ({ page }) => {
  await installInjectedWallet(page);
});

test("completes the guarded collateral and debt journey", async ({ page }) => {
  await page.goto("/deposit");
  await connectWallet(page);

  await completeAction(page, { amount: "2", label: "Deposit", path: "/deposit" });
  await completeAction(page, { amount: "500", label: "Borrow", path: "/borrow" });
  await completeAction(page, { amount: "100", label: "Repay", path: "/repay" });

  await page.goto("/deposit");
  await page.getByRole("button", { name: "Withdraw" }).click();
  await expect(page.getByLabel("Withdraw amount")).toBeEnabled();
  await page.getByLabel("Withdraw amount").fill("0.5");
  await page.getByRole("button", { name: "Review withdraw" }).click();
  await expect(page.getByText("Estimated health")).toBeVisible();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("status", { name: "Confirmed on-chain" })).toBeVisible({
    timeout: 30_000,
  });

  const currentPosition = page.getByText("Current position", { exact: true }).locator("..");
  await expect(currentPosition).toContainText("1.5 ETH");
  await expect(currentPosition).toContainText("400");
});
