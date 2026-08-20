import { describe, expect, it, vi } from "vitest";

import { createProtocolReader } from "./protocol-client";

const ACCOUNT = "0x1234567890abcdef1234567890abcdef12345678";

function createFixture() {
  const lendingPool = {
    getAccount: vi.fn().mockResolvedValue([5n, 3n, 1n]),
    getBorrowingPower: vi.fn().mockResolvedValue(7n),
    getCollateralValue: vi.fn().mockResolvedValue(10n),
    getHealthFactor: vi.fn().mockResolvedValue(2n),
    getMaxLiquidatableDebt: vi.fn().mockResolvedValue(3n),
    getProtocolStats: vi.fn().mockResolvedValue([5n, 10n, 3n, 4n, 6n]),
    isLiquidatable: vi.fn().mockResolvedValue(false),
    previewDebt: vi.fn().mockResolvedValue(4n),
    previewInterest: vi.fn().mockResolvedValue(1n),
  };
  const priceOracle = {
    getEthUsdPrice: vi.fn().mockResolvedValue(2_000n * 10n ** 8n),
    getLastUpdated: vi.fn().mockResolvedValue(100n),
  };
  const stablecoin = {
    balanceOf: vi.fn().mockResolvedValue(8n),
    totalSupply: vi.fn().mockResolvedValue(9n),
  };
  const provider = {
    getBalance: vi.fn().mockResolvedValue(11n),
    getBlockNumber: vi.fn().mockResolvedValue(42),
  };
  return { contracts: { lendingPool, priceOracle, stablecoin }, provider };
}

describe("protocol reader", () => {
  it("resolves protocol and connected-account state in parallel", async () => {
    const fixture = createFixture();
    const read = createProtocolReader({ ...fixture, skipValidation: true });
    const result = await read(ACCOUNT);

    expect(result).toMatchObject({
      account: {
        borrowedAmount: 4n,
        borrowingPower: 7n,
        collateralAmount: 5n,
        collateralValue: 10n,
        healthFactor: 2n,
        maxLiquidatableDebt: 3n,
        previewInterest: 1n,
        stablecoinBalance: 8n,
        storedBorrowedAmount: 3n,
        walletEthBalance: 11n,
      },
      blockNumber: 42,
      protocol: {
        borrowRate: 6n,
        ethUsdPrice: 2_000n * 10n ** 8n,
        totalBorrowed: 3n,
        totalCollateral: 5n,
        utilizationRate: 4n,
      },
    });
  });

  it("keeps protocol reads available without a connected account", async () => {
    const fixture = createFixture();
    const read = createProtocolReader({ ...fixture, skipValidation: true });
    const result = await read();

    expect(result.account).toBeNull();
    expect(result.protocol.totalCollateralValue).toBe(10n);
    expect(fixture.contracts.lendingPool.getAccount).not.toHaveBeenCalled();
    expect(fixture.provider.getBalance).not.toHaveBeenCalled();
  });
});
