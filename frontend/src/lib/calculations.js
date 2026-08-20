import { MaxUint256 } from "ethers";

export const WAD = 10n ** 18n;
export const COLLATERAL_RATIO = 15n * 10n ** 17n;
export const LIQUIDATION_THRESHOLD = 85n * 10n ** 16n;
export const LIQUIDATION_BONUS = 7n * 10n ** 16n;

function min(left, right) {
  return left < right ? left : right;
}

export function collateralValue(ethAmount, oraclePrice) {
  if (!ethAmount || !oraclePrice) return 0n;
  const normalizedPrice = BigInt(oraclePrice) * 10n ** 10n;
  return (BigInt(ethAmount) * normalizedPrice) / WAD;
}

export function borrowingPower(collateralAmount, debt, oraclePrice) {
  const maximumDebt = (collateralValue(collateralAmount, oraclePrice) * WAD) / COLLATERAL_RATIO;
  return maximumDebt > debt ? maximumDebt - debt : 0n;
}

export function healthFactor(collateralAmount, debt, oraclePrice) {
  if (debt === 0n) return MaxUint256;
  return (collateralValue(collateralAmount, oraclePrice) * LIQUIDATION_THRESHOLD) / debt;
}

export function previewPosition(action, amount, position, oraclePrice) {
  const currentCollateral = BigInt(position?.collateralAmount ?? 0n);
  const currentDebt = BigInt(position?.borrowedAmount ?? 0n);
  let nextCollateral = currentCollateral;
  let nextDebt = currentDebt;

  if (action === "deposit") nextCollateral += amount;
  if (action === "withdraw") nextCollateral = amount > nextCollateral ? 0n : nextCollateral - amount;
  if (action === "borrow") nextDebt += amount;
  if (action === "repay") nextDebt = amount >= nextDebt ? 0n : nextDebt - amount;

  return {
    borrowingPower: borrowingPower(nextCollateral, nextDebt, oraclePrice),
    collateralAmount: nextCollateral,
    collateralValue: collateralValue(nextCollateral, oraclePrice),
    debt: nextDebt,
    healthFactor: healthFactor(nextCollateral, nextDebt, oraclePrice),
  };
}

export function liquidationReward(debtToRepay, collateralAmount, oraclePrice) {
  if (!debtToRepay || !oraclePrice) return { bonus: 0n, collateral: 0n };
  const normalizedPrice = BigInt(oraclePrice) * 10n ** 10n;
  const base = (BigInt(debtToRepay) * WAD + normalizedPrice - 1n) / normalizedPrice;
  const bonus = (base * LIQUIDATION_BONUS) / WAD;
  const collateral = min(base + bonus, BigInt(collateralAmount));
  return { bonus: collateral > base ? collateral - base : 0n, collateral };
}
