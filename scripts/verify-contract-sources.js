import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { INITIAL_ETH_PRICE, MAX_ORACLE_STALENESS } from "./lib/deploy-protocol.js";

const SEPOLIA_CHAIN_ID = 11_155_111;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const manifestPath = path.resolve(
  repositoryRoot,
  process.argv[2] || "deployments/11155111.json",
);

function requireEnvironmentVariable(name) {
  if (!process.env[name]?.trim()) {
    throw new Error(`${name} must be configured in the current shell.`);
  }
}

function verify(address, constructorArguments) {
  const hardhatCli = path.join(repositoryRoot, "node_modules", "hardhat", "dist", "src", "cli.js");
  const result = spawnSync(
    process.execPath,
    [hardhatCli, "verify", "etherscan", "--network", "sepolia", address, ...constructorArguments],
    { cwd: repositoryRoot, env: process.env, stdio: "inherit" },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Etherscan verification failed for ${address}.`);
  }
}

async function main() {
  requireEnvironmentVariable("SEPOLIA_RPC_URL");
  requireEnvironmentVariable("ETHERSCAN_API_KEY");

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.chainId !== SEPOLIA_CHAIN_ID || manifest.network !== "sepolia") {
    throw new Error("Source verification requires the committed Sepolia deployment manifest.");
  }

  const { contracts, deployer } = manifest;
  const deployments = [
    ["PriceOracle", contracts.PriceOracle, [deployer, INITIAL_ETH_PRICE, MAX_ORACLE_STALENESS]],
    ["InterestEngine", contracts.InterestEngine, []],
    ["CollateralVault", contracts.CollateralVault, [deployer]],
    ["Stablecoin", contracts.Stablecoin, [deployer]],
    [
      "LendingPool",
      contracts.LendingPool,
      [
        contracts.CollateralVault,
        contracts.Stablecoin,
        contracts.PriceOracle,
        contracts.InterestEngine,
      ],
    ],
  ];

  for (const [name, address, constructorArguments] of deployments) {
    console.log(`Verifying ${name} at ${address}`);
    verify(address, constructorArguments.map(String));
  }

  console.log("Published source verification for all five Aegis modules on Sepolia.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
