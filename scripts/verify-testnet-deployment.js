import { readFile } from "node:fs/promises";
import path from "node:path";

import { Contract, isAddress, isHexString, JsonRpcProvider } from "ethers";

const SEPOLIA_CHAIN_ID = 11155111;
const REQUIRED_CONTRACTS = [
  "CollateralVault",
  "InterestEngine",
  "LendingPool",
  "PriceOracle",
  "Stablecoin",
];
const REQUIRED_TRANSACTIONS = [
  ...REQUIRED_CONTRACTS,
  "StablecoinAuthority",
  "VaultAuthority",
];
const ADDRESS_ABI = [
  "function collateralVault() view returns (address)",
  "function interestEngine() view returns (address)",
  "function priceOracle() view returns (address)",
  "function stablecoin() view returns (address)",
];
const LENDING_POOL_ABI = ["function lendingPool() view returns (address)"];
const OWNABLE_ABI = ["function owner() view returns (address)"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameAddress(left, right) {
  return left.toLowerCase() === right.toLowerCase();
}

async function main() {
  const manifestPath = path.resolve(process.argv[2] || "deployments/11155111.json");
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  assert(rpcUrl, "Set SEPOLIA_RPC_URL before verifying the deployment.");

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert(manifest.chainId === SEPOLIA_CHAIN_ID, "Manifest must target Ethereum Sepolia (11155111).");
  assert(isAddress(manifest.deployer), "Manifest deployer is missing or invalid.");

  const addresses = REQUIRED_CONTRACTS.map((name) => {
    const address = manifest.contracts?.[name];
    assert(isAddress(address), `${name} address is missing or invalid.`);
    return address;
  });
  assert(
    new Set(addresses.map((address) => address.toLowerCase())).size === addresses.length,
    "Every protocol module must have a unique address.",
  );
  for (const name of REQUIRED_TRANSACTIONS) {
    assert(isHexString(manifest.transactions?.[name], 32), `${name} transaction hash is invalid.`);
  }

  const provider = new JsonRpcProvider(rpcUrl, SEPOLIA_CHAIN_ID, { staticNetwork: true });
  const network = await provider.getNetwork();
  assert(Number(network.chainId) === SEPOLIA_CHAIN_ID, "RPC endpoint is not Ethereum Sepolia.");
  const codes = await Promise.all(addresses.map((address) => provider.getCode(address)));
  assert(codes.every((code) => code !== "0x"), "One or more deployment addresses contain no bytecode.");

  const contracts = manifest.contracts;
  const lendingPool = new Contract(contracts.LendingPool, ADDRESS_ABI, provider);
  const collateralVault = new Contract(contracts.CollateralVault, LENDING_POOL_ABI, provider);
  const stablecoin = new Contract(contracts.Stablecoin, LENDING_POOL_ABI, provider);
  const priceOracle = new Contract(contracts.PriceOracle, OWNABLE_ABI, provider);
  const [vault, engine, oracle, token, vaultPool, tokenPool, oracleOwner] = await Promise.all([
    lendingPool.collateralVault(),
    lendingPool.interestEngine(),
    lendingPool.priceOracle(),
    lendingPool.stablecoin(),
    collateralVault.lendingPool(),
    stablecoin.lendingPool(),
    priceOracle.owner(),
  ]);

  assert(sameAddress(vault, contracts.CollateralVault), "LendingPool vault wiring is invalid.");
  assert(sameAddress(engine, contracts.InterestEngine), "LendingPool engine wiring is invalid.");
  assert(sameAddress(oracle, contracts.PriceOracle), "LendingPool oracle wiring is invalid.");
  assert(sameAddress(token, contracts.Stablecoin), "LendingPool stablecoin wiring is invalid.");
  assert(sameAddress(vaultPool, contracts.LendingPool), "Vault authority is invalid.");
  assert(sameAddress(tokenPool, contracts.LendingPool), "Stablecoin authority is invalid.");
  assert(sameAddress(oracleOwner, manifest.deployer), "Oracle owner differs from the manifest deployer.");

  console.log(`Verified ${REQUIRED_CONTRACTS.length} Aegis modules on Sepolia (${manifest.chainId}).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
