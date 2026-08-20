import { expect } from "chai";
import { network } from "hardhat";
import {
  deployProtocol,
  MAX_ORACLE_STALENESS,
} from "./helpers/deploy-protocol.js";

const { ethers, networkHelpers } = await network.create();

async function fixture() {
  return deployProtocol(ethers);
}

describe("Protocol boundaries", function () {
  it("rejects zero-value state changes", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const pool = protocol.lendingPool.connect(protocol.borrower);

    await expect(pool.deposit({ value: 0 })).to.be.revertedWithCustomError(
      protocol.lendingPool,
      "ZeroAmount",
    );
    await expect(pool.withdraw(0)).to.be.revertedWithCustomError(
      protocol.lendingPool,
      "ZeroAmount",
    );
    await expect(pool.borrow(0)).to.be.revertedWithCustomError(
      protocol.lendingPool,
      "ZeroAmount",
    );
    await expect(pool.repay(0)).to.be.revertedWithCustomError(
      protocol.lendingPool,
      "ZeroAmount",
    );
  });

  it("enforces the minimum residual debt rule", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const pool = protocol.lendingPool.connect(protocol.borrower);
    await pool.deposit({ value: ethers.parseEther("1") });

    await expect(
      pool.borrow(ethers.parseEther("0.009")),
    ).to.be.revertedWithCustomError(protocol.lendingPool, "DebtBelowMinimum");
    await expect(pool.borrow(ethers.parseEther("0.01"))).not.to.be.revert(
      ethers,
    );
  });

  it("rejects repayment dust but clears an explicitly overfunded full repayment", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const borrowerAddress = await protocol.borrower.getAddress();
    const pool = protocol.lendingPool.connect(protocol.borrower);
    await pool.deposit({ value: ethers.parseEther("2") });
    await pool.borrow(ethers.parseEther("1000"));

    await expect(
      pool.repay(ethers.parseEther("999.999")),
    ).to.be.revertedWithCustomError(protocol.lendingPool, "DebtBelowMinimum");

    const fundingPool = protocol.lendingPool.connect(protocol.liquidator);
    await fundingPool.deposit({ value: ethers.parseEther("1") });
    await fundingPool.borrow(ethers.parseEther("1"));
    await protocol.stablecoin
      .connect(protocol.liquidator)
      .transfer(borrowerAddress, ethers.parseEther("1"));
    await pool.repay(ethers.MaxUint256);

    const account = await protocol.lendingPool.getAccount(borrowerAddress);
    expect(account.borrowedAmount).to.equal(0);
    expect(account.lastInterestUpdate).to.equal(0);
  });

  it("allows a safe withdrawal and rejects the next unsafe step", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const pool = protocol.lendingPool.connect(protocol.borrower);
    await pool.deposit({ value: ethers.parseEther("1") });
    await pool.borrow(ethers.parseEther("1000"));

    await expect(pool.withdraw(ethers.parseEther("0.249"))).not.to.be.revert(
      ethers,
    );
    await expect(
      pool.withdraw(ethers.parseEther("0.001")),
    ).to.be.revertedWithCustomError(protocol.lendingPool, "UnsafeWithdrawal");
  });

  it("protects the liquidation threshold boundary", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const borrowerAddress = await protocol.borrower.getAddress();
    const pool = protocol.lendingPool.connect(protocol.borrower);
    await pool.deposit({ value: ethers.parseEther("1") });
    await pool.borrow(ethers.parseEther("849"));

    await protocol.priceOracle.setPrice(1_000n * 10n ** 8n);
    expect(await protocol.lendingPool.isLiquidatable(borrowerAddress)).to.equal(
      false,
    );

    await protocol.priceOracle.setPrice(998n * 10n ** 8n);
    expect(await protocol.lendingPool.isLiquidatable(borrowerAddress)).to.equal(
      true,
    );
  });

  it("accepts an oracle price at the freshness limit and rejects the next block", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const updatedAt = await protocol.priceOracle.getLastUpdated();
    const pool = protocol.lendingPool.connect(protocol.borrower);
    await pool.deposit({ value: ethers.parseEther("1") });

    await networkHelpers.time.setNextBlockTimestamp(
      updatedAt + MAX_ORACLE_STALENESS,
    );
    await expect(pool.borrow(ethers.parseEther("100"))).not.to.be.revert(
      ethers,
    );
    await expect(
      pool.borrow(ethers.parseEther("1")),
    ).to.be.revertedWithCustomError(protocol.priceOracle, "StalePrice");
  });

  it("rejects oracle modules with more than 18 decimals", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const latestBlock = await ethers.provider.getBlock("latest");
    const invalidOracle = await ethers.deployContract("MockPriceOracle", [
      1n,
      19,
      BigInt(latestBlock.timestamp),
      1n,
    ]);
    await invalidOracle.waitForDeployment();

    await expect(
      ethers.deployContract("LendingPool", [
        await protocol.collateralVault.getAddress(),
        await protocol.stablecoin.getAddress(),
        await invalidOracle.getAddress(),
        await protocol.interestEngine.getAddress(),
      ]),
    )
      .to.be.revertedWithCustomError(
        protocol.lendingPool,
        "InvalidOracleDecimals",
      )
      .withArgs(19);
  });

  it("rejects zero prices even when an adapter returns one", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const latestBlock = await ethers.provider.getBlock("latest");
    const zeroOracle = await ethers.deployContract("MockPriceOracle", [
      0,
      8,
      BigInt(latestBlock.timestamp),
      1n,
    ]);
    await zeroOracle.waitForDeployment();
    const pool = await ethers.deployContract("LendingPool", [
      await protocol.collateralVault.getAddress(),
      await protocol.stablecoin.getAddress(),
      await zeroOracle.getAddress(),
      await protocol.interestEngine.getAddress(),
    ]);
    await pool.waitForDeployment();

    await expect(
      pool.getCollateralValue(await protocol.borrower.getAddress()),
    ).to.be.revertedWithCustomError(pool, "InvalidOraclePrice");
  });

  it("rejects zero and non-contract protocol modules", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const outsiderAddress = await protocol.outsider.getAddress();
    const validModules = [
      await protocol.stablecoin.getAddress(),
      await protocol.priceOracle.getAddress(),
      await protocol.interestEngine.getAddress(),
    ];

    await expect(
      ethers.deployContract("LendingPool", [ethers.ZeroAddress, ...validModules]),
    ).to.be.revertedWithCustomError(protocol.lendingPool, "InvalidAddress");
    await expect(
      ethers.deployContract("LendingPool", [outsiderAddress, ...validModules]),
    )
      .to.be.revertedWithCustomError(protocol.lendingPool, "InvalidModule")
      .withArgs(outsiderAddress);
  });
});
