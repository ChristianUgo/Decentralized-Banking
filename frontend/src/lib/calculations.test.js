import { MaxUint256 } from "ethers";
import { describe, expect, it } from "vitest";

import {
  borrowingPower,
  collateralValue,
  healthFactor,
  liquidationReward,
  previewPosition,
  WAD,
} from "./calculations";

const PRICE = 2_000n * 10n ** 8n;

describe("transaction previews", () => {
  it("converts ETH collateral and mirrors borrowing capacity with integer math", () => {
    expect(collateralValue(WAD, PRICE)).toBe(2_000n * WAD);
    expect(borrowingPower(WAD, 1_000n * WAD, PRICE)).toBe(333333333333333333333n);
  });

  it("treats debt-free positions as maximally healthy", () => {
    expect(healthFactor(WAD, 0n, PRICE)).toBe(MaxUint256);
  });

  it("previews borrow and repay without floating-point arithmetic", () => {
    const position = { borrowedAmount: 500n * WAD, collateralAmount: WAD };
    const borrowed = previewPosition("borrow", 100n * WAD, position, PRICE);
    const repaid = previewPosition("repay", 500n * WAD, position, PRICE);

    expect(borrowed.debt).toBe(600n * WAD);
    expect(borrowed.healthFactor).toBe(2_833333333333333333n);
    expect(repaid.debt).toBe(0n);
    expect(repaid.healthFactor).toBe(MaxUint256);
  });

  it("estimates the configured seven-percent liquidation reward", () => {
    const result = liquidationReward(1_000n * WAD, WAD, PRICE);
    expect(result.collateral).toBe(535n * 10n ** 15n);
    expect(result.bonus).toBe(35n * 10n ** 15n);
  });
});
