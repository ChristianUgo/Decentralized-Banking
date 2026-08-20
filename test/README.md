# Protocol tests

Stages 2 and 3 use focused JavaScript suites rather than one oversized scenario file:

- `interest-engine.test.js` verifies the 2%-18% kinked rate curve and elapsed-time interest.
- `lending-pool.test.js` covers deposits, borrowing, repayment, withdrawals, limits, and lazy accrual.
- `liquidation.test.js` covers healthy-position rejection and exact liquidation-bonus accounting.
- `protocol-safety.test.js` covers controller access, permanent authority assignment, and stale prices.
- `protocol-boundaries.test.js` covers zero values, debt dust, withdrawal/liquidation thresholds, freshness edges, and invalid modules.
- `liquidation-boundaries.test.js` covers insufficient liquidator balance, collateral caps, and over-seizure prevention.
- `oracle-ownership.test.js` verifies authorization, zero-price rejection, and two-step ownership.
- `adversarial-receiver.test.js` verifies rejected ETH rollback and blocked withdrawal reentrancy.
- `interest-engine.fuzz.test.js` runs 200 seeded property cases across rates, utilization, elapsed time, and rounding.
- `protocol-invariants.test.js` executes 30 seeded, randomized sequences across two accounts and reconciles collateral, debt, DBUSD supply, and health after every action.
- `helpers/deploy-protocol.js` provides one small deployment fixture shared by the behavior suites.

Run `pnpm test:contracts` for all protocol tests or `pnpm test:invariants` for the property suites. Every test file remains below 200 lines. Seeds are fixed for reproducibility and fast-check reports the failing path if a property regresses.
