# ADR 0006: Transaction lifecycle and preflight

## Status

Accepted for Stage 5.

## Context

Deposit, withdraw, borrow, repay and liquidation must share reliable wallet feedback without moving transaction authority to a backend. User-entered decimal values, wallet account changes, lazy interest, oracle movement and RPC failures can otherwise make previews misleading or signatures unsafe.

## Decision

- Keep writes in explicit client components and create the ethers signer only after a connected account is on the configured chain.
- Parse all ETH and DBUSD values into 18-decimal `bigint` base units. Reject blank, zero, malformed, over-balance, over-capacity, unsafe-withdrawal and debt-dust inputs before wallet interaction.
- Mirror contract formulas only for labeled impact estimates. Run `staticCall` against the exact method and arguments before presenting the final review.
- Use one reducer lifecycle for every action: preparing, reviewing, signing, submitted, confirmed or error.
- Display estimated gas and fee when the wallet RPC supplies fee data. Do not add a client gas limit; the wallet/provider remains responsible for the final estimate.
- Treat the receipt status as confirmation truth. Dispatch a refresh event only after status `1`.
- Invalidate prepared execution closures when the connected account or chain changes.
- Preserve direct DBUSD burn semantics for repay and liquidation. No ERC-20 approval is requested because the LendingPool is the token's permanently authorized burner.

## Consequences

- A successful preflight catches many deterministic reverts but does not reserve oracle price, debt, balance, nonce, gas or transaction ordering.
- Exact contract checks still run during execution, so a reviewed transaction may revert if state changes before mining.
- The persistent status drawer exposes wallet rejection, submitted hash, confirmation and plain-language failures across navigation.
- Stage 5 remains a local-development implementation. Testnet wallet matrices, end-to-end automation and production explorer links remain Stage 7 work.
