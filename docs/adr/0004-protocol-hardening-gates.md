# ADR 0004: Protocol hardening gates

- Status: Accepted for local development
- Date: 2026-08-17

## Context

Core Stage 2 behavior was unit-tested but did not yet provide arbitrary-sequence evidence, hostile receiver coverage, static analysis, or measured gas regression limits. The protocol remains unaudited and its manual oracle is unsuitable for production.

## Decision

- Use fixed-seed `fast-check` properties for interest inputs and two-account action sequences so failures are reproducible.
- Reconcile vault/account collateral, protocol collateral, stored versus preview debt, DBUSD supply, and account health after every randomized action.
- Add explicit debt-dust, withdrawal, health, freshness, oracle-decimal, module-address, liquidation-cap, ownership, rejected-transfer, and reentrancy boundaries.
- Run Solhint with a zero-warning security-focused policy locally and Slither 0.11.6 as a medium-severity CI gate.
- Establish a deterministic gas scenario with per-operation ceilings and record every before/after optimization.
- Cache constructor-validated oracle decimals and use one normalized price snapshot throughout liquidation.
- Do not add upgrade, pause, or mutable risk controls without a separate governance design.

## Consequences

- Stage 3 provides substantially stronger automated evidence while still making no audit or production-safety claim.
- Fixed seeds keep CI deterministic; future stages should add additional seeds and longer-running campaigns outside the primary PR gate.
- Gas regressions fail locally and in CI, but recorded values are not network fee estimates.
- Slither requires Linux CI in the current Windows environment and must be green before merge.
- Immutable administration minimizes privileged paths but makes defects require redeployment and migration.
