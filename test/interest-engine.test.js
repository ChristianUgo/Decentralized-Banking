import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();
const WAD = ethers.parseEther("1");

describe("InterestEngine", function () {
  let interestEngine;

  beforeEach(async function () {
    interestEngine = await ethers.deployContract("InterestEngine");
    await interestEngine.waitForDeployment();
  });

  it("matches the documented kinked utilization curve", async function () {
    const collateralValue = ethers.parseEther("100");

    expect(await interestEngine.getBorrowRate(0, collateralValue)).to.equal(
      ethers.parseEther("0.02"),
    );
    expect(
      await interestEngine.getBorrowRate(
        ethers.parseEther("40"),
        collateralValue,
      ),
    ).to.equal(ethers.parseEther("0.06"));
    expect(
      await interestEngine.getBorrowRate(
        ethers.parseEther("80"),
        collateralValue,
      ),
    ).to.equal(ethers.parseEther("0.10"));
    expect(
      await interestEngine.getBorrowRate(collateralValue, collateralValue),
    ).to.equal(ethers.parseEther("0.18"));
  });

  it("caps utilization at 100 percent", async function () {
    expect(
      await interestEngine.getUtilizationRate(
        ethers.parseEther("120"),
        ethers.parseEther("100"),
      ),
    ).to.equal(WAD);
  });

  it("calculates simple interest for elapsed time", async function () {
    const principal = ethers.parseEther("1000");
    const oneYear = 365n * 24n * 60n * 60n;

    expect(
      await interestEngine.calculateInterest(
        principal,
        oneYear,
        ethers.parseEther("80"),
        ethers.parseEther("100"),
      ),
    ).to.equal(ethers.parseEther("100"));
  });
});
