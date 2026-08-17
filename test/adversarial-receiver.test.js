import { expect } from "chai";
import { network } from "hardhat";
import { deployProtocol } from "./helpers/deploy-protocol.js";

const { ethers, networkHelpers } = await network.create();

async function fixture() {
  const protocol = await deployProtocol(ethers);
  const receiver = await ethers.deployContract("AdversarialReceiver", [
    await protocol.lendingPool.getAddress(),
  ]);
  await receiver.waitForDeployment();
  await receiver.deposit({ value: ethers.parseEther("1") });
  return { ...protocol, receiver };
}

describe("Adversarial ETH receivers", function () {
  it("rolls back accounting when the recipient rejects ETH", async function () {
    const { collateralVault, lendingPool, receiver } =
      await networkHelpers.loadFixture(fixture);
    const receiverAddress = await receiver.getAddress();
    await receiver.setReceiveMode(2);

    await expect(
      receiver.withdraw(ethers.parseEther("0.25")),
    ).to.be.revertedWithCustomError(collateralVault, "TransferFailed");

    const account = await lendingPool.getAccount(receiverAddress);
    expect(account.collateralAmount).to.equal(ethers.parseEther("1"));
    expect(await collateralVault.getBalance(receiverAddress)).to.equal(
      ethers.parseEther("1"),
    );
  });

  it("blocks a withdrawal reentrancy attempt without blocking the transfer", async function () {
    const { collateralVault, lendingPool, receiver } =
      await networkHelpers.loadFixture(fixture);
    const receiverAddress = await receiver.getAddress();
    await receiver.setReceiveMode(1);

    await receiver.withdraw(ethers.parseEther("0.25"));

    expect(await receiver.reentrySucceeded()).to.equal(false);
    const account = await lendingPool.getAccount(receiverAddress);
    expect(account.collateralAmount).to.equal(ethers.parseEther("0.75"));
    expect(await collateralVault.getBalance(receiverAddress)).to.equal(
      account.collateralAmount,
    );
  });
});
