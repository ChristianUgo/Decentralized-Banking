import { describe, expect, it } from "vitest";

import { WAD } from "./calculations";
import { getActionMaximum, parseAmount, validateActionAmount, validateBorrowerAddress } from "./validators";

const PRICE = 2_000n * 10n ** 8n;
const position = {
  borrowedAmount: 1_000n * WAD,
  borrowingPower: 333n * WAD,
  collateralAmount: WAD,
  stablecoinBalance: 1_200n * WAD,
  walletEthBalance: 2n * WAD,
};

describe("transaction validation", () => {
  it("accepts exact decimals and rejects zero or excessive precision", () => {
    expect(parseAmount("1.25")).toMatchObject({ amount: 125n * 10n ** 16n, error: null });
    expect(parseAmount("0").error).toMatch(/greater than zero/i);
    expect(parseAmount("1.0000000000000000001").error).toMatch(/18 decimals/i);
  });

  it("reserves ETH for gas when choosing the deposit maximum", () => {
    expect(getActionMaximum("deposit", position)).toBe(1999n * 10n ** 15n);
  });

  it("blocks over-capacity borrow and unsafe withdrawal values", () => {
    expect(validateActionAmount("borrow", "334", position, PRICE).error).toMatch(/borrowing power/i);
    expect(validateActionAmount("withdraw", "0.3", position, PRICE).error).toMatch(/borrowing requirement/i);
  });

  it("allows full repayment but blocks a debt-dust remainder", () => {
    expect(validateActionAmount("repay", "1000", position, PRICE)).toMatchObject({ amount: 1_000n * WAD, error: null });
    expect(validateActionAmount("repay", "999.995", position, PRICE).error).toMatch(/0.01 DBUSD/i);
  });

  it("normalizes borrower addresses", () => {
    expect(validateBorrowerAddress("0x1234567890abcdef1234567890abcdef12345678").error).toBeNull();
    expect(validateBorrowerAddress("not-an-address").error).toMatch(/valid borrower/i);
  });
});
