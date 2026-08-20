import { expect } from "chai";
import { network } from "hardhat";
import { deployProtocol } from "./helpers/deploy-protocol.js";

const { ethers } = await network.create();

describe("LendingPool liquidation", function () {
  let protocol;
  let borrowerAddress;
  let liquidatorAddress;

  beforeEach(async function () {
    protocol = await deployProtocol(ethers);
    borrowerAddress = await protocol.borrower.getAddress();
    liquidatorAddress = await protocol.liquidator.getAddress();

    await protocol.lendingPool
      .connect(protocol.borrower)
      .deposit({ value: ethers.parseEther("10") });
    await protocol.lendingPool
      .connect(protocol.borrower)
      .borrow(ethers.parseEther("10000"));
  });

  it("does not allow a healthy position to be liquidated", async function () {
    await expect(
      protocol.lendingPool
        .connect(protocol.liquidator)
        .liquidate(borrowerAddress),
    ).to.be.revertedWithCustomError(protocol.lendingPool, "HealthyPosition");
  });

  it("repays unhealthy debt and awards the documented collateral bonus", async function () {
    const debt = ethers.parseEther("10000");
    await protocol.lendingPool
      .connect(protocol.liquidator)
      .deposit({ value: ethers.parseEther("1") });
    await protocol.lendingPool
      .connect(protocol.liquidator)
      .borrow(ethers.parseEther("500"));
    await protocol.stablecoin
      .connect(protocol.borrower)
      .transfer(liquidatorAddress, debt);
    await protocol.priceOracle.setPrice(1_100n * 10n ** 8n);

    expect(await protocol.lendingPool.isLiquidatable(borrowerAddress)).to.equal(
      true,
    );

    const transaction = await protocol.lendingPool
      .connect(protocol.liquidator)
      .liquidate(borrowerAddress);
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
    const price = ethers.parseEther("1100");
    const baseCollateral =
      (event.args.debtRepaid * ethers.WeiPerEther + price - 1n) / price;
    const expectedBonus =
      (baseCollateral * ethers.parseEther("0.07")) / ethers.WeiPerEther;

    expect(event.args.liquidator).to.equal(liquidatorAddress);
    expect(event.args.user).to.equal(borrowerAddress);
    expect(event.args.collateralSeized).to.equal(
      baseCollateral + expectedBonus,
    );

    const account = await protocol.lendingPool.getAccount(borrowerAddress);
    expect(account.borrowedAmount).to.equal(0);
    expect(account.collateralAmount).to.be.gt(0);
    expect(await protocol.stablecoin.balanceOf(liquidatorAddress)).to.be.gt(0);
  });
});
