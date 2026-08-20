import deployment from "../contracts/addresses.json";

const DEFAULT_RPC_URL = "http://127.0.0.1:8545";

export function parseChainId(value) {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value !== "string" || value.trim() === "") return null;

  const radix = value.startsWith("0x") ? 16 : 10;
  const parsed = Number.parseInt(value, radix);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function toHexChainId(chainId) {
  return `0x${Number(chainId).toString(16)}`;
}

export const targetChain = Object.freeze({
  id: deployment.chainId,
  hexId: toHexChainId(deployment.chainId),
  name: "Hardhat Local",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || DEFAULT_RPC_URL,
  nativeCurrency: Object.freeze({ name: "Ether", symbol: "ETH", decimals: 18 }),
});

export function getWalletChainParameters(chain = targetChain) {
  return {
    chainId: chain.hexId,
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: [chain.rpcUrl],
  };
}
