import { describe, expect, it } from "vitest";

import { getWalletChainParameters, parseChainId, toHexChainId } from "./chain";

describe("chain configuration", () => {
  it("normalizes decimal, hexadecimal, and bigint chain identifiers", () => {
    expect(parseChainId("0x7a69")).toBe(31337);
    expect(parseChainId("31337")).toBe(31337);
    expect(parseChainId(31337n)).toBe(31337);
    expect(parseChainId("not-a-chain")).toBeNull();
  });

  it("builds EIP-3085 wallet parameters", () => {
    const chain = {
      hexId: toHexChainId(31337),
      name: "Local",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrl: "http://127.0.0.1:8545",
    };

    expect(getWalletChainParameters(chain)).toEqual({
      chainId: "0x7a69",
      chainName: "Local",
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: [chain.rpcUrl],
    });
  });
});
