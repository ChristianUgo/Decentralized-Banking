import { expect } from "chai";
import { network } from "hardhat";
import { deployProtocol } from "./helpers/deploy-protocol.js";

const { ethers, networkHelpers } = await network.create();

async function fixture() {
  const protocol = await deployProtocol(ethers);
  const borrowerAddress = await protocol.borrower.getAddress();
  const liquidatorAddress = await protocol.liquidator.getAddress();

  await protocol.lendingPool
    .connect(protocol.borrower)
    .deposit({ value: ethers.parseEther("10") });
  await protocol.lendingPool
    .connect(protocol.borrower)
    .borrow(ethers.parseEther("10000"));
  await protocol.lendingPool
    .connect(protocol.liquidator)
    .deposit({ value: ethers.parseEther("1") });
  await protocol.lendingPool
    .connect(protocol.liquidator)
    .borrow(ethers.parseEther("500"));

  return { ...protocol, borrowerAddress, liquidatorAddress };
}

describe("Liquidation boundaries", function () {
  it("cannot burn more DBUSD than the liquidator owns", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    await protocol.priceOracle.setPrice(1_000n * 10n ** 8n);

    await expect(
      protocol.lendingPool
        .connect(protocol.liquidator)
        .liquidate(protocol.borrowerAddress),
    ).to.be.revertedWithCustomError(
      protocol.stablecoin,
      "ERC20InsufficientBalance",
    );

    const account = await protocol.lendingPool.getAccount(
      protocol.borrowerAddress,
    );
    expect(account.collateralAmount).to.equal(ethers.parseEther("10"));
    expect(account.borrowedAmount).to.be.gt(ethers.parseEther("10000"));
  });

  it("caps repayment by available collateral and never over-seizes", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    await protocol.stablecoin
      .connect(protocol.borrower)
      .transfer(protocol.liquidatorAddress, ethers.parseEther("10000"));
    await protocol.priceOracle.setPrice(1_000n * 10n ** 8n);
    const maximumDebt = await protocol.lendingPool.getMaxLiquidatableDebt(
      protocol.borrowerAddress,
    );

    const transaction = await protocol.lendingPool
      .connect(protocol.liquidator)
      .liquidate(protocol.borrowerAddress);
    const receipt = await transaction.wait();
    const event = receipt.logs
      .map((log) => {
        try {
          return protocol.lendingPool.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log) => log?.name === "Liquidated");

    expect(event.args.debtRepaid).to.equal(maximumDebt);
    expect(event.args.collateralSeized).to.equal(ethers.parseEther("10"));
    const account = await protocol.lendingPool.getAccount(
      protocol.borrowerAddress,
    );
    expect(account.collateralAmount).to.equal(0);
    expect(account.borrowedAmount).to.be.gt(0);
  });
});
