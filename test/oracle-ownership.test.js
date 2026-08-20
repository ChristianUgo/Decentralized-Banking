import { expect } from "chai";
import { network } from "hardhat";
import { deployProtocol } from "./helpers/deploy-protocol.js";

const { ethers, networkHelpers } = await network.create();

async function fixture() {
  return deployProtocol(ethers);
}

describe("PriceOracle ownership", function () {
  it("rejects unauthorized and zero-price updates", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const outsiderAddress = await protocol.outsider.getAddress();

    await expect(
      protocol.priceOracle.connect(protocol.outsider).setPrice(1n),
    )
      .to.be.revertedWithCustomError(
        protocol.priceOracle,
        "OwnableUnauthorizedAccount",
      )
      .withArgs(outsiderAddress);
    await expect(
      protocol.priceOracle.setPrice(0),
    ).to.be.revertedWithCustomError(protocol.priceOracle, "InvalidPrice");
  });

  it("requires the nominated owner to accept ownership", async function () {
    const protocol = await networkHelpers.loadFixture(fixture);
    const ownerAddress = await protocol.owner.getAddress();
    const borrowerAddress = await protocol.borrower.getAddress();

    await protocol.priceOracle.transferOwnership(borrowerAddress);
    expect(await protocol.priceOracle.owner()).to.equal(ownerAddress);
    expect(await protocol.priceOracle.pendingOwner()).to.equal(borrowerAddress);

    await protocol.priceOracle.connect(protocol.borrower).acceptOwnership();
    expect(await protocol.priceOracle.owner()).to.equal(borrowerAddress);
    expect(await protocol.priceOracle.pendingOwner()).to.equal(
      ethers.ZeroAddress,
    );
  });
});
