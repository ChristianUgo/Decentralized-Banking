# Protocol tests

Stage 2 uses focused JavaScript suites rather than one oversized scenario file:

- `interest-engine.test.js` verifies the 2%-18% kinked rate curve and elapsed-time interest.
- `lending-pool.test.js` covers deposits, borrowing, repayment, withdrawals, limits, and lazy accrual.
- `liquidation.test.js` covers healthy-position rejection and exact liquidation-bonus accounting.
- `protocol-safety.test.js` covers controller access, permanent authority assignment, and stale prices.
- `helpers/deploy-protocol.js` provides one small deployment fixture shared by the behavior suites.

Run `pnpm test:contracts`. Every Stage 2 test file remains below 200 lines. Stateful invariants, fuzzing, gas baselines, static analysis, and adversarial receiver contracts are deliberately assigned to Stage 3.
