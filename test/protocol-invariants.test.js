import { expect } from "chai";
import fc from "fast-check";
import { network } from "hardhat";
import { deployProtocol } from "./helpers/deploy-protocol.js";

const { ethers, networkHelpers } = await network.create();
const MINIMUM_DEBT = ethers.parseEther("0.01");

async function fixture() {
  return deployProtocol(ethers);
}

async function assertInvariants(protocol, users) {
  const stats = await protocol.lendingPool.getProtocolStats();
  let totalCollateral = 0n;
  let totalPreviewDebt = 0n;
  let totalTokenBalance = 0n;

  for (const user of users) {
    const userAddress = await user.getAddress();
    const account = await protocol.lendingPool.getAccount(userAddress);
    const vaultBalance = await protocol.collateralVault.getBalance(userAddress);
    const tokenBalance = await protocol.stablecoin.balanceOf(userAddress);

    expect(vaultBalance).to.equal(account.collateralAmount);
    totalCollateral += account.collateralAmount;
    totalPreviewDebt += account.borrowedAmount;
    totalTokenBalance += tokenBalance;
    if (account.borrowedAmount > 0) {
      expect(await protocol.lendingPool.getHealthFactor(userAddress)).to.be.gte(
        ethers.WeiPerEther,
      );
    }
  }

  expect(stats.totalCollateral).to.equal(totalCollateral);
  expect(stats.totalBorrowed).to.be.lte(totalPreviewDebt);
  expect(await protocol.stablecoin.totalSupply()).to.equal(totalTokenBalance);
}

async function executeCommand(protocol, user, command) {
  const pool = protocol.lendingPool.connect(user);
  const userAddress = await user.getAddress();
  const account = await protocol.lendingPool.getAccount(userAddress);
  const tokenBalance = await protocol.stablecoin.balanceOf(userAddress);

  if (command.action === "deposit") {
    await pool.deposit({ value: ethers.parseEther(command.amount) });
    return;
  }
  if (command.action === "borrow") {
    const power = await protocol.lendingPool.getBorrowingPower(userAddress);
    if (power < MINIMUM_DEBT) return;
    const amount = (power * BigInt(command.percent)) / 100n;
    if (amount < MINIMUM_DEBT) return;
    try {
      await pool.borrow(amount);
    } catch {}
    return;
  }
  if (command.action === "repay") {
    if (tokenBalance === 0n || account.borrowedAmount === 0n) return;
    const amount = (tokenBalance * BigInt(command.percent)) / 100n;
    if (amount === 0n) return;
    try {
      await pool.repay(amount);
    } catch {}
    return;
  }
  if (account.collateralAmount === 0n) return;
  const amount =
    (account.collateralAmount * BigInt(command.percent)) / 100n;
  if (amount === 0n) return;
  try {
    await pool.withdraw(amount);
  } catch {}
}

describe("Protocol stateful invariants", function () {
  this.timeout(120_000);

  it("preserves collateral, debt, supply, and health across action sequences", async function () {
    const command = fc.record({
      action: fc.constantFrom("deposit", "borrow", "repay", "withdraw"),
      actor: fc.integer({ min: 0, max: 1 }),
      amount: fc.constantFrom("0.01", "0.05", "0.1", "0.5"),
      percent: fc.integer({ min: 1, max: 100 }),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(command, { minLength: 5, maxLength: 20 }),
        async (commands) => {
          const protocol = await networkHelpers.loadFixture(fixture);
          const users = [protocol.borrower, protocol.liquidator];
          for (const nextCommand of commands) {
            await executeCommand(
              protocol,
              users[nextCommand.actor],
              nextCommand,
            );
            await assertInvariants(protocol, users);
          }
        },
      ),
      { numRuns: 30, seed: 20260817 },
    );
  });
});
