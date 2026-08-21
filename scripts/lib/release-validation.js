import { isAddress, isHexString } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;
export const REQUIRED_CONTRACTS = Object.freeze([
  "CollateralVault",
  "InterestEngine",
  "LendingPool",
  "PriceOracle",
  "Stablecoin",
]);
export const REQUIRED_TRANSACTIONS = Object.freeze([
  ...REQUIRED_CONTRACTS,
  "StablecoinAuthority",
  "VaultAuthority",
]);

function validatePublicUrl(value, label, { expectedOrigin } = {}) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be an absolute URL.`);
  }
  if (parsed.protocol !== "https:") throw new Error(`${label} must use HTTPS.`);
  if (parsed.username || parsed.password) throw new Error(`${label} must not contain credentials.`);
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i.test(parsed.hostname)) {
    throw new Error(`${label} must not target a local host.`);
  }
  if (expectedOrigin && parsed.origin !== expectedOrigin) {
    throw new Error(`${label} must use ${expectedOrigin}.`);
  }
  return parsed;
}

export function validateProductionRelease({ deployment, environment, exportedDeployment }) {
  if (deployment.chainId !== SEPOLIA_CHAIN_ID || deployment.network !== "sepolia") {
    throw new Error("The production manifest must target Ethereum Sepolia (11155111).");
  }
  if (!isAddress(deployment.deployer)) throw new Error("The deployment owner is invalid.");

  const addresses = REQUIRED_CONTRACTS.map((name) => {
    const address = deployment.contracts?.[name];
    if (!isAddress(address)) throw new Error(`${name} address is invalid.`);
    return address.toLowerCase();
  });
  if (new Set(addresses).size !== addresses.length) {
    throw new Error("Every production contract address must be unique.");
  }
  for (const name of REQUIRED_TRANSACTIONS) {
    if (!isHexString(deployment.transactions?.[name], 32)) {
      throw new Error(`${name} transaction hash is invalid.`);
    }
  }
  if (JSON.stringify(exportedDeployment) !== JSON.stringify(deployment)) {
    throw new Error("The frontend address export does not match the Sepolia manifest.");
  }

  const siteUrl = validatePublicUrl(environment.NEXT_PUBLIC_SITE_URL, "NEXT_PUBLIC_SITE_URL");
  validatePublicUrl(environment.NEXT_PUBLIC_RPC_URL, "NEXT_PUBLIC_RPC_URL");
  validatePublicUrl(environment.NEXT_PUBLIC_EXPLORER_URL, "NEXT_PUBLIC_EXPLORER_URL", {
    expectedOrigin: "https://sepolia.etherscan.io",
  });

  return Object.freeze({
    chainId: deployment.chainId,
    contractCount: addresses.length,
    siteOrigin: siteUrl.origin,
  });
}
