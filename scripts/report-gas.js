import { network } from "hardhat";
import { deployProtocol } from "./lib/deploy-protocol.js";

const GAS_CEILINGS = {
  deposit: 140_000n,
  borrow: 200_000n,
  repay: 110_000n,
  withdraw: 125_000n,
  oracleUpdate: 50_000n,
  liquidate: 140_000n,
};

async function measure(name, transactionPromise, measurements) {
  const transaction = await transactionPromise;
  const receipt = await transaction.wait();
  const gasUsed = receipt.gasUsed;
  const ceiling = GAS_CEILINGS[name];

  measurements[name] = {
    gasUsed: Number(gasUsed),
    ceiling: Number(ceiling),
    headroom: `${Number(((ceiling - gasUsed) * 10_000n) / ceiling) / 100}%`,
  };

  if (gasUsed > ceiling) {
    throw new Error(`${name} used ${gasUsed} gas, above the ${ceiling} ceiling`);
  }
}

async function main() {
  const { ethers } = await network.create();
  const protocol = await deployProtocol(ethers);
  const measurements = {};
  const borrowerPool = protocol.lendingPool.connect(protocol.borrower);
  const liquidatorPool = protocol.lendingPool.connect(protocol.liquidator);

  await measure(
    "deposit",
    borrowerPool.deposit({ value: ethers.parseEther("10") }),
    measurements,
  );
  await measure(
    "borrow",
    borrowerPool.borrow(ethers.parseEther("10000")),
    measurements,
  );
  await measure(
    "repay",
    borrowerPool.repay(ethers.parseEther("1000")),
    measurements,
  );
  await measure(
    "withdraw",
    borrowerPool.withdraw(ethers.parseEther("1")),
    measurements,
  );

  await liquidatorPool.deposit({ value: ethers.parseEther("5") });
  await liquidatorPool.borrow(ethers.parseEther("5000"));
  await protocol.stablecoin
    .connect(protocol.borrower)
    .transfer(
      await protocol.liquidator.getAddress(),
      ethers.parseEther("9000"),
    );
  await measure(
    "oracleUpdate",
    protocol.priceOracle.setPrice(1_000n * 10n ** 8n),
    measurements,
  );
  await measure(
    "liquidate",
    liquidatorPool.liquidate(await protocol.borrower.getAddress()),
    measurements,
  );

  console.table(measurements);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
