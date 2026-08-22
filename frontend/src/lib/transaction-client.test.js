import { describe, expect, it, vi } from "vitest";

import { targetChain } from "./chain";
import { getTransactionErrorMessage, prepareProtocolTransaction } from "./transaction-client";

const ACCOUNT = "0x1234567890abcdef1234567890abcdef12345678";

function createMethod(result = { hash: "0xabc" }) {
  const method = vi.fn().mockResolvedValue(result);
  method.staticCall = vi.fn().mockResolvedValue(undefined);
  method.estimateGas = vi.fn().mockResolvedValue(21_000n);
  return method;
}

function createFixture() {
  const signer = { getAddress: vi.fn().mockResolvedValue(ACCOUNT) };
  const provider = {
    getCode: vi.fn().mockResolvedValue("0x1234"),
    getFeeData: vi.fn().mockResolvedValue({ gasPrice: 2n, maxFeePerGas: null }),
    getNetwork: vi.fn().mockResolvedValue({ chainId: BigInt(targetChain.id) }),
    getSigner: vi.fn().mockResolvedValue(signer),
  };
  const contract = { borrow: createMethod(), deposit: createMethod(), liquidate: createMethod() };
  return { contract, provider };
}

describe("transaction errors", () => {
  it("distinguishes wallet rejection from contract reverts", () => {
    expect(getTransactionErrorMessage({ code: 4001 })).toMatch(/wallet request was rejected/i);
    expect(getTransactionErrorMessage({ revert: { name: "UnsafeWithdrawal" } })).toMatch(/make the position unsafe/i);
    expect(getTransactionErrorMessage({ shortMessage: "execution reverted: HealthyPosition" })).toMatch(/cannot be liquidated/i);
  });

  it("preserves an unknown actionable error", () => {
    expect(getTransactionErrorMessage({ shortMessage: "RPC quota exceeded" })).toBe("RPC quota exceeded");
  });

  it("simulates and estimates the exact deposit before exposing execution", async () => {
    const fixture = createFixture();
    const prepared = await prepareProtocolTransaction({
      action: "deposit",
      amount: 5n,
      createContract: () => fixture.contract,
      createProvider: () => fixture.provider,
      expectedAccount: ACCOUNT,
      getProvider: () => ({}),
    });

    expect(fixture.contract.deposit.staticCall).toHaveBeenCalledWith({ value: 5n });
    expect(fixture.contract.deposit.estimateGas).toHaveBeenCalledWith({ value: 5n });
    expect(prepared).toMatchObject({ estimatedFee: 42_000n, gasEstimate: 21_000n });
    await prepared.execute();
    expect(fixture.contract.deposit).toHaveBeenCalledWith({ value: 5n });
  });

  it("rejects a signer that no longer matches the reviewed account", async () => {
    const fixture = createFixture();
    await expect(
      prepareProtocolTransaction({
        action: "borrow",
        amount: 5n,
        createContract: () => fixture.contract,
        createProvider: () => fixture.provider,
        expectedAccount: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        getProvider: () => ({}),
      }),
    ).rejects.toThrow(/active wallet account changed/i);
  });
});
