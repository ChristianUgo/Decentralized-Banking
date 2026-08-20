# ADR 0003: Protocol architecture and risk parameters

- Status: Accepted for local development
- Date: 2026-08-15

## Context

The source project separates collateral custody, debt-token issuance, interest calculations, price data, and lending coordination. It documents a 150% collateral ratio, 85% liquidation threshold, 7% liquidation bonus, 2% base APR, 80% optimal utilization, and 0.01 DBUSD minimum debt. The modern implementation must preserve that behavior while making deployment authority and testing assumptions explicit.

## Decision

Implement five contracts behind narrow interfaces: `CollateralVault`, `Stablecoin`, `InterestEngine`, `PriceOracle`, and `LendingPool`.

- Vault and stablecoin owners assign the LendingPool exactly once after deployment. The assignment cannot be changed.
- Pool module addresses and financial parameters are immutable.
- The interest engine uses the documented kinked curve: 2% at 0% utilization, 10% at 80%, and 18% at 100%.
- The local oracle exposes an owner-updated, 8-decimal ETH/USD price and rejects data older than its configured freshness window.
- Liquidation uses an 85% health threshold, 7% collateral bonus, and 100% close factor to preserve the source's one-click action.
- DBUSD repayment and liquidation burn from the caller under the pool's exclusive token authority, preserving the source's no-approval user journey.
- Account interest is simple, per-second, and materialized lazily before debt-sensitive state changes.

## Consequences

- Contract responsibilities, access boundaries, and frontend ABI surfaces remain easy to explain and test.
- Explicit post-deployment wiring is safer and clearer than relying on predicted contract addresses.
- The local oracle is centralized by design and must be replaced by a reviewed production adapter.
- A 100% close factor can create larger liquidation transactions and deserves reconsideration with market/liquidity evidence before production.
- Direct burns reduce transaction count but differ from conventional allowance-based repayment; wallet UX and external integrations must document this behavior.
- Lazy accrual keeps writes bounded, but protocol-wide stored debt can exclude interest for accounts that have not been touched recently.
- Stage 3 must add stateful invariants, fuzz boundaries, malicious ETH receiver tests, gas measurement, static analysis, and a production deployment threat model.
