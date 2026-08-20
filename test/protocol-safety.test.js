import { expect } from "chai";
import { network } from "hardhat";
import {
  deployProtocol,
  MAX_ORACLE_STALENESS,
} from "./helpers/deploy-protocol.js";

const { ethers } = await network.create();

describe("Protocol access and oracle safety", function () {
  let protocol;
  let borrowerAddress;

  beforeEach(async function () {
    protocol = await deployProtocol(ethers);
    borrowerAddress = await protocol.borrower.getAddress();
  });

  it("restricts collateral and token authority to the LendingPool", async function () {
    await expect(
      protocol.collateralVault
        .connect(protocol.outsider)
        .deposit(borrowerAddress, { value: 1n }),
    ).to.be.revertedWithCustomError(
      protocol.collateralVault,
      "OnlyLendingPool",
    );
    await expect(
      protocol.stablecoin.connect(protocol.outsider).mint(borrowerAddress, 1n),
    ).to.be.revertedWithCustomError(protocol.stablecoin, "OnlyLendingPool");
  });

  it("makes LendingPool authority assignment permanent", async function () {
    await expect(
      protocol.collateralVault.setLendingPool(
        await protocol.lendingPool.getAddress(),
      ),
    ).to.be.revertedWithCustomError(
      protocol.collateralVault,
      "LendingPoolAlreadyConfigured",
    );
    await expect(
      protocol.stablecoin.setLendingPool(
        await protocol.lendingPool.getAddress(),
      ),
    ).to.be.revertedWithCustomError(
      protocol.stablecoin,
      "LendingPoolAlreadyConfigured",
    );
  });

  it("rejects stale oracle data in value-sensitive operations", async function () {
    await ethers.provider.send("evm_increaseTime", [
      Number(MAX_ORACLE_STALENESS + 1n),
    ]);
    await ethers.provider.send("evm_mine", []);

    await (
      await protocol.lendingPool
        .connect(protocol.borrower)
        .deposit({ value: ethers.parseEther("1") })
    ).wait();
    await expect(
      protocol.lendingPool
        .connect(protocol.borrower)
        .borrow(ethers.parseEther("100")),
    ).to.be.revertedWithCustomError(protocol.priceOracle, "StalePrice");
  });
});
