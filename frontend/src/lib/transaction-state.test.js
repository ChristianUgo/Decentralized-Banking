import { describe, expect, it } from "vitest";

import { initialTransactionState, isTransactionBusy, transactionReducer } from "./transaction-state";

describe("transaction state", () => {
  it("tracks preflight, review, wallet, submission and confirmation", () => {
    let state = transactionReducer(initialTransactionState, { action: "deposit", type: "PREPARING" });
    expect(isTransactionBusy(state.status)).toBe(true);

    state = transactionReducer(state, { estimatedFee: 2n, gasEstimate: 1n, summary: {}, type: "REVIEW" });
    expect(state).toMatchObject({ action: "deposit", status: "reviewing" });

    state = transactionReducer(state, { type: "SIGNING" });
    state = transactionReducer(state, { hash: "0xabc", type: "SUBMITTED" });
    state = transactionReducer(state, { receipt: { status: 1 }, type: "CONFIRMED" });
    expect(state).toMatchObject({ hash: "0xabc", status: "confirmed" });
  });

  it("preserves context on failure and clears everything on reset", () => {
    const preparing = transactionReducer(initialTransactionState, { action: "repay", type: "PREPARING" });
    const failed = transactionReducer(preparing, { error: "Rejected", type: "FAILED" });
    expect(failed).toMatchObject({ action: "repay", error: "Rejected", status: "error" });
    expect(transactionReducer(failed, { type: "RESET" })).toBe(initialTransactionState);
  });
});
