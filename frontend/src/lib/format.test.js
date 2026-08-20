import { MaxUint256 } from "ethers";
import { describe, expect, it } from "vitest";

import {
  formatAmount,
  formatHealthFactor,
  formatPercent,
  getHealthState,
  shortenAddress,
  WAD,
} from "./format";

describe("on-chain value formatting", () => {
  it("groups whole units and trims fixed-point dust", () => {
    expect(formatAmount(1_234_567_890_000_000_000_000n, { maxFraction: 3 })).toBe(
      "1,234.567",
    );
    expect(formatAmount(2_000_000_000n, { decimals: 8, maxFraction: 2 })).toBe("20");
    expect(formatAmount(null)).toBe("—");
  });

  it("formats WAD percentages and debt-free health", () => {
    expect(formatPercent(85n * 10n ** 16n)).toBe("85%");
    expect(formatHealthFactor(15n * 10n ** 17n)).toBe("1.5");
    expect(formatHealthFactor(MaxUint256)).toBe("No debt");
  });

  it("classifies liquidation boundaries without floating point", () => {
    expect(getHealthState(0n, MaxUint256).label).toBe("No debt");
    expect(getHealthState(WAD, WAD - 1n).label).toBe("Liquidatable");
    expect(getHealthState(WAD, WAD).label).toBe("At risk");
    expect(getHealthState(WAD, 2n * WAD).label).toBe("Healthy");
  });

  it("shortens connected account labels", () => {
    expect(shortenAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234…5678",
    );
    expect(shortenAddress(null)).toBe("Not connected");
  });
});
