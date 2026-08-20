import { expect } from "chai";
import { network } from "hardhat";
import { deployProtocol } from "./helpers/deploy-protocol.js";

const { ethers } = await network.create();

describe("LendingPool core flows", function () {
  let protocol;
  let borrowerAddress;

  beforeEach(async function () {
    protocol = await deployProtocol(ethers);
    borrowerAddress = await protocol.borrower.getAddress();
  });

  it("deposits ETH into the isolated collateral vault", async function () {
    const amount = ethers.parseEther("2");

    await expect(
      protocol.lendingPool.connect(protocol.borrower).deposit({ value: amount }),
    )
      .to.emit(protocol.lendingPool, "CollateralDeposited")
      .withArgs(borrowerAddress, amount);

    const account = await protocol.lendingPool.getAccount(borrowerAddress);
    expect(account.collateralAmount).to.equal(amount);
    expect(await protocol.collateralVault.getBalance(borrowerAddress)).to.equal(
      amount,
    );
  });

  it("borrows DBUSD within the 150 percent collateral ratio", async function () {
    await protocol.lendingPool
      .connect(protocol.borrower)
      .deposit({ value: ethers.parseEther("3") });
    const debt = ethers.parseEther("3000");

    await expect(protocol.lendingPool.connect(protocol.borrower).borrow(debt))
      .to.emit(protocol.lendingPool, "Borrowed")
      .withArgs(borrowerAddress, debt);

    expect(await protocol.stablecoin.balanceOf(borrowerAddress)).to.equal(debt);
    expect(await protocol.lendingPool.previewDebt(borrowerAddress)).to.be.gte(
      debt,
    );
  });

  it("rejects over-borrowing and unsafe collateral withdrawals", async function () {
    await protocol.lendingPool
      .connect(protocol.borrower)
      .deposit({ value: ethers.parseEther("1") });

    await expect(
      protocol.lendingPool
        .connect(protocol.borrower)
        .borrow(ethers.parseEther("1400")),
    ).to.be.revertedWithCustomError(
      protocol.lendingPool,
      "BorrowLimitExceeded",
    );

    await protocol.lendingPool
      .connect(protocol.borrower)
      .borrow(ethers.parseEther("1000"));

    await expect(
      protocol.lendingPool
        .connect(protocol.borrower)
        .withdraw(ethers.parseEther("0.5")),
    ).to.be.revertedWithCustomError(protocol.lendingPool, "UnsafeWithdrawal");
  });

  it("repays debt and then releases collateral", async function () {
    const collateral = ethers.parseEther("2");
    const debt = ethers.parseEther("1000");
    await protocol.lendingPool
      .connect(protocol.borrower)
      .deposit({ value: collateral });
    await protocol.lendingPool.connect(protocol.borrower).borrow(debt);
    await protocol.lendingPool
      .connect(protocol.liquidator)
      .deposit({ value: ethers.parseEther("1") });
    await protocol.lendingPool
      .connect(protocol.liquidator)
      .borrow(ethers.parseEther("1"));
    await protocol.stablecoin
      .connect(protocol.liquidator)
      .transfer(borrowerAddress, ethers.parseEther("1"));

    await expect(
      protocol.lendingPool.connect(protocol.borrower).repay(ethers.MaxUint256),
    ).to.emit(protocol.lendingPool, "Repaid");
    await protocol.lendingPool.connect(protocol.borrower).withdraw(collateral);

    const account = await protocol.lendingPool.getAccount(borrowerAddress);
    expect(account.borrowedAmount).to.equal(0);
    expect(account.collateralAmount).to.equal(0);
  });

  it("accrues debt as block time advances", async function () {
    const debt = ethers.parseEther("1000");
    await protocol.lendingPool
      .connect(protocol.borrower)
      .deposit({ value: ethers.parseEther("2") });
    await protocol.lendingPool.connect(protocol.borrower).borrow(debt);

    await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    await protocol.priceOracle.setPrice(2_000n * 10n ** 8n);

    expect(await protocol.lendingPool.previewInterest(borrowerAddress)).to.be.gt(
      0,
    );
    expect(await protocol.lendingPool.previewDebt(borrowerAddress)).to.be.gt(
      debt,
    );
  });
});
