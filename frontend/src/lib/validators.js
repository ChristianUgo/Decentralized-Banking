import { getAddress, parseUnits } from "ethers";

import { COLLATERAL_RATIO, collateralValue, WAD } from "./calculations";

export const MINIMUM_DEBT = 10n ** 16n;
const DEPOSIT_GAS_RESERVE = 10n ** 15n;

export function parseAmount(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return { amount: null, error: "Enter an amount." };
  if (!/^\d+(\.\d{0,18})?$/.test(normalized)) {
    return { amount: null, error: "Use a positive number with no more than 18 decimals." };
  }

  const amount = parseUnits(normalized, 18);
  if (amount === 0n) return { amount: null, error: "Amount must be greater than zero." };
  return { amount, error: null };
}

export function getActionMaximum(action, position) {
  if (!position) return 0n;
  if (action === "deposit") {
    const balance = BigInt(position.walletEthBalance ?? 0n);
    return balance > DEPOSIT_GAS_RESERVE ? balance - DEPOSIT_GAS_RESERVE : 0n;
  }
  if (action === "withdraw") return BigInt(position.collateralAmount ?? 0n);
  if (action === "borrow") return BigInt(position.borrowingPower ?? 0n);
  if (action === "repay") {
    const debt = BigInt(position.borrowedAmount ?? 0n);
    const balance = BigInt(position.stablecoinBalance ?? 0n);
    return debt < balance ? debt : balance;
  }
  return 0n;
}

export function validateActionAmount(action, value, position, oraclePrice) {
  const parsed = parseAmount(value);
  if (parsed.error) return parsed;
  if (!position) return { amount: null, error: "Connect a wallet and load your position first." };

  const { amount } = parsed;
  const debt = BigInt(position.borrowedAmount ?? 0n);
  if (action === "deposit" && amount > BigInt(position.walletEthBalance ?? 0n)) {
    return { amount: null, error: "Amount exceeds your ETH wallet balance." };
  }
  if (action === "withdraw") {
    if (amount > BigInt(position.collateralAmount ?? 0n)) {
      return { amount: null, error: "Amount exceeds your deposited collateral." };
    }
    const remaining = BigInt(position.collateralAmount) - amount;
    const maximumDebt = (collateralValue(remaining, oraclePrice) * WAD) / COLLATERAL_RATIO;
    if (debt > maximumDebt) {
      return { amount: null, error: "This withdrawal would leave the position below its borrowing requirement." };
    }
  }
  if (action === "borrow" && amount > BigInt(position.borrowingPower ?? 0n)) {
    return { amount: null, error: "Amount exceeds your available borrowing power." };
  }
  if (action === "borrow" && debt + amount < MINIMUM_DEBT) {
    return { amount: null, error: "The resulting debt must be at least 0.01 DBUSD." };
  }
  if (action === "repay") {
    if (debt === 0n) return { amount: null, error: "This account has no debt to repay." };
    if (amount > BigInt(position.stablecoinBalance ?? 0n)) {
      return { amount: null, error: "Amount exceeds your DBUSD wallet balance." };
    }
    if (amount > debt) return { amount: null, error: "Amount exceeds your current debt." };
    const remaining = debt - amount;
    if (remaining > 0n && remaining < MINIMUM_DEBT) {
      return { amount: null, error: "Repay in full or leave at least 0.01 DBUSD outstanding." };
    }
  }
  return { amount, error: null };
}

export function validateBorrowerAddress(value) {
  try {
    return { address: getAddress(String(value ?? "").trim()), error: null };
  } catch {
    return { address: null, error: "Enter a valid borrower address." };
  }
}
