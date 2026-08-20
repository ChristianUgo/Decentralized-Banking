import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";
import { exportFrontendArtifacts } from "./export-frontend-artifacts.js";
import { deployProtocol } from "./lib/deploy-protocol.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

async function main() {
  const connection = await network.create();
  const { ethers, networkName } = connection;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  console.log(`Deploying Stage 2 protocol to ${networkName} (${chainId})`);
  console.log(`Deployer: ${deployerAddress}`);

  const {
    collateralVault,
    interestEngine,
    lendingPool,
    priceOracle,
    stablecoin,
  } = await deployProtocol(ethers);
  const lendingPoolAddress = await lendingPool.getAddress();

  const manifest = {
    chainId,
    network: networkName,
    deployer: deployerAddress,
    contracts: {
      CollateralVault: await collateralVault.getAddress(),
      InterestEngine: await interestEngine.getAddress(),
      LendingPool: lendingPoolAddress,
      PriceOracle: await priceOracle.getAddress(),
      Stablecoin: await stablecoin.getAddress(),
    },
  };

  const deploymentsDirectory = path.join(repositoryRoot, "deployments");
  await mkdir(deploymentsDirectory, { recursive: true });
  await writeFile(
    path.join(deploymentsDirectory, `${chainId}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await exportFrontendArtifacts(manifest);

  console.log("Stage 2 protocol deployed and frontend artifacts exported.");
  console.table(manifest.contracts);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
