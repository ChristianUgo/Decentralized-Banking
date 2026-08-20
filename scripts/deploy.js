import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";
import { exportFrontendArtifacts } from "./export-frontend-artifacts.js";

const INITIAL_ETH_USD_PRICE = 2_000n * 10n ** 8n;
const MAX_ORACLE_STALENESS = 24n * 60n * 60n;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

async function deployContract(ethers, name, constructorArguments = []) {
  const contract = await ethers.deployContract(name, constructorArguments);
  await contract.waitForDeployment();
  return contract;
}

async function main() {
  const connection = await network.create();
  const { ethers, networkName } = connection;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  console.log(`Deploying Stage 2 protocol to ${networkName} (${chainId})`);
  console.log(`Deployer: ${deployerAddress}`);

  const priceOracle = await deployContract(ethers, "PriceOracle", [
    deployerAddress,
    INITIAL_ETH_USD_PRICE,
    MAX_ORACLE_STALENESS,
  ]);
  const interestEngine = await deployContract(ethers, "InterestEngine");
  const collateralVault = await deployContract(ethers, "CollateralVault", [
    deployerAddress,
  ]);
  const stablecoin = await deployContract(ethers, "Stablecoin", [
    deployerAddress,
  ]);
  const lendingPool = await deployContract(ethers, "LendingPool", [
    await collateralVault.getAddress(),
    await stablecoin.getAddress(),
    await priceOracle.getAddress(),
    await interestEngine.getAddress(),
  ]);

  const lendingPoolAddress = await lendingPool.getAddress();
  await (await collateralVault.setLendingPool(lendingPoolAddress)).wait();
  await (await stablecoin.setLendingPool(lendingPoolAddress)).wait();

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
