import { Contract, isAddress, JsonRpcProvider } from "ethers";

import abis from "../contracts/abis.json";
import deployment from "../contracts/addresses.json";
import { targetChain } from "./chain";

const REQUIRED_CONTRACTS = ["LendingPool", "PriceOracle", "Stablecoin"];

function requireAddress(name) {
  const address = deployment.contracts[name];
  if (!isAddress(address)) throw new Error(`Missing or invalid ${name} deployment address.`);
  return address;
}

export function createReadProvider() {
  if (!targetChain.rpcUrl) {
    throw new Error(`Set NEXT_PUBLIC_RPC_URL for ${targetChain.name}.`);
  }
  return new JsonRpcProvider(targetChain.rpcUrl, targetChain.id, { staticNetwork: true });
}

export function createProtocolContracts(provider) {
  return {
    lendingPool: new Contract(requireAddress("LendingPool"), abis.LendingPool, provider),
    priceOracle: new Contract(requireAddress("PriceOracle"), abis.PriceOracle, provider),
    stablecoin: new Contract(requireAddress("Stablecoin"), abis.Stablecoin, provider),
  };
}

function readField(result, name, index) {
  return result?.[name] ?? result?.[index];
}

export function normalizeProtocolResults({
  accountResult,
  accountReads,
  blockNumber,
  oracleReads,
  protocolStats,
}) {
  const account = accountResult
    ? {
        collateralAmount: readField(accountResult, "collateralAmount", 0),
        storedBorrowedAmount: readField(accountResult, "borrowedAmount", 1),
        borrowedAmount:
          accountReads?.previewDebt ?? readField(accountResult, "borrowedAmount", 1),
        lastInterestUpdate: readField(accountResult, "lastInterestUpdate", 2),
        ...accountReads,
      }
    : null;

  return {
    account,
    blockNumber,
    protocol: {
      totalCollateral: readField(protocolStats, "totalCollateral", 0),
      totalCollateralValue: readField(protocolStats, "totalCollateralValue", 1),
      totalBorrowed: readField(protocolStats, "totalBorrowed", 2),
      utilizationRate: readField(protocolStats, "utilizationRate", 3),
      borrowRate: readField(protocolStats, "borrowRate", 4),
      ...oracleReads,
    },
    readAt: Date.now(),
  };
}

async function validateDeployment(provider) {
  const codes = await Promise.all(
    REQUIRED_CONTRACTS.map((name) => provider.getCode(requireAddress(name))),
  );
  if (codes.some((code) => code === "0x")) {
    throw new Error(
      `Protocol contracts are not deployed on ${targetChain.name}. Run pnpm deploy:local.`,
    );
  }
}

export function createProtocolReader({
  contracts,
  provider = createReadProvider(),
  skipValidation = false,
} = {}) {
  const protocolContracts = contracts || createProtocolContracts(provider);
  let validated = skipValidation;

  return async function readProtocol(accountAddress = null) {
    if (!validated) {
      await validateDeployment(provider);
      validated = true;
    }

    const { lendingPool, priceOracle, stablecoin } = protocolContracts;
    const [protocolStats, ethUsdPrice, oracleLastUpdated, stablecoinSupply, blockNumber] =
      await Promise.all([
        lendingPool.getProtocolStats(),
        priceOracle.getEthUsdPrice(),
        priceOracle.getLastUpdated(),
        stablecoin.totalSupply(),
        provider.getBlockNumber(),
      ]);

    let accountResult = null;
    let accountReads = null;
    if (accountAddress) {
      const [position, previewDebt, previewInterest, collateralValue, healthFactor, borrowingPower, maxLiquidatableDebt, stablecoinBalance, walletEthBalance, isLiquidatable] =
        await Promise.all([
          lendingPool.getAccount(accountAddress),
          lendingPool.previewDebt(accountAddress),
          lendingPool.previewInterest(accountAddress),
          lendingPool.getCollateralValue(accountAddress),
          lendingPool.getHealthFactor(accountAddress),
          lendingPool.getBorrowingPower(accountAddress),
          lendingPool.getMaxLiquidatableDebt(accountAddress),
          stablecoin.balanceOf(accountAddress),
          provider.getBalance(accountAddress),
          lendingPool.isLiquidatable(accountAddress),
        ]);
      accountResult = position;
      accountReads = {
        borrowingPower,
        collateralValue,
        healthFactor,
        isLiquidatable,
        maxLiquidatableDebt,
        previewDebt,
        previewInterest,
        stablecoinBalance,
        walletEthBalance,
      };
    }

    return normalizeProtocolResults({
      accountResult,
      accountReads,
      blockNumber,
      oracleReads: { ethUsdPrice, oracleLastUpdated, stablecoinSupply },
      protocolStats,
    });
  };
}

let defaultReader;

export function getProtocolReader() {
  defaultReader = defaultReader || createProtocolReader();
  return defaultReader;
}

export function getProtocolErrorMessage(error) {
  const message = error?.shortMessage || error?.message || "Protocol reads failed.";
  if (/ECONNREFUSED|could not detect network|failed to fetch/i.test(message)) {
    return `Cannot reach ${targetChain.name} at ${targetChain.rpcUrl}. Start the local node and deploy the protocol.`;
  }
  return message;
}
