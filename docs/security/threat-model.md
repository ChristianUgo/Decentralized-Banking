# Stage 3 protocol threat model

## Scope and status

This model covers the Solidity protocol, local deployment wiring, and generated address/ABI boundary at the Stage 3 commit. It does not approve testnet or mainnet use. The manual oracle and local chain manifest are development fixtures.

## Assets and security objectives

- ETH collateral must remain attributable to the correct account and leave the vault only through valid pool actions.
- DBUSD supply must be created or destroyed only by the permanently assigned LendingPool.
- Debt, collateral, health, interest, and liquidation accounting must use consistent units and rounding.
- Oracle values must be positive, correctly scaled, and fresh when a value-sensitive action executes.
- Deployment addresses and module authority must not be silently replaceable.

## Actors and trust boundaries

| Actor | Capability and trust assumption |
| --- | --- |
| Borrower | Controls their wallet and may submit arbitrary values, ordering, and timing. Never trusted to preserve solvency voluntarily. |
| Liquidator | Permissionless and economically motivated. May choose transaction timing and target any account. |
| Oracle owner | Fully trusted in the local implementation; can change all health factors and liquidation eligibility. This trust is unacceptable for production. |
| Vault/stablecoin owner | Can nominate the LendingPool once through two-step deployment operations, then cannot replace it. |
| LendingPool | Sole trusted coordinator for collateral movement and DBUSD mint/burn. Its address and module references are immutable. |
| Frontend/RPC | Untrusted presentation and transport. Contract checks remain authoritative even if previews, RPC data, or UI state are wrong. |

## Primary threats and controls

| Threat | Existing control | Residual risk / production requirement |
| --- | --- | --- |
| Reentrant ETH recipient | Pool and vault reentrancy guards, checks-effects-interactions, adversarial receiver tests | New value-moving paths require equivalent tests and review. |
| Rejected ETH transfer | Vault checks call success; transaction rollback preserves account and vault totals | A rejecting contract cannot withdraw until it accepts ETH or uses a future alternate recipient design. |
| Unauthorized mint/burn | Stablecoin restricts both operations to the one-time LendingPool | A pool defect has full supply authority; independent review is mandatory. |
| Over-borrow or unsafe withdrawal | 150% capacity checks, accrued debt before mutation, invariant and boundary suites | Oracle manipulation or extreme price gaps can still create bad debt. |
| Healthy-account liquidation | 85% health threshold and explicit boundary tests | Transactions can be front-run around real oracle updates; production design needs MEV/slippage analysis. |
| Excess liquidation | 100% close factor plus collateral-value cap and 7% bonus accounting | Full close increases price impact; reassess with market-liquidity evidence before deployment. |
| Oracle manipulation/staleness | Positive-price rule, immutable decimal count, freshness window | Replace the owner-updated oracle with a reviewed decentralized adapter, heartbeat, deviation, and sequencer controls. |
| Decimal or rounding error | 18-decimal normalized price, `Math.mulDiv`, explicit ceil/floor direction, fuzz and boundary tests | Every new asset/decimal combination needs independent tests. |
| Interest/supply divergence | Lazy interest is materialized before debt mutations; stored debt never decreases without burn/liquidation | Aggregate stored debt can lag inactive-account interest and debt can exceed token supply; economics require review. |
| Repayment abuse | Pool burns from caller and rejects non-zero dust below 0.01 DBUSD | Direct burn differs from allowance-based integrations and requires sufficient caller balance including interest. |
| Deployment substitution | Contract-code checks, immutable module references, one-time controller assignment | Incorrect initial deployment requires full redeployment; verify manifests and bytecode independently. |
| Compromised admin key | Two-step ownership limits accidental transfer | Local oracle owner remains powerful; production needs multisig/timelock and least-privilege design. |
| Dependency/supply-chain compromise | Exact versions, pnpm lock policies, dependency audit, CI, Slither/Solhint | Review dependency and GitHub Action updates; pin immutable action SHAs before a release candidate. |

## Invariants under test

- Vault per-account balance equals LendingPool collateral accounting.
- Protocol collateral total equals the sum of tested account collateral after every transition.
- DBUSD supply changes only with authorized debt actions.
- Stored aggregate debt never exceeds preview debt for the tested active account.
- A debt-bearing account remains healthy after any successful borrow or withdrawal at a constant valid price.
- Interest utilization and rate remain bounded and monotonic for fuzzed inputs.
- Liquidation cannot seize more collateral than the borrower owns or burn more DBUSD than the liquidator owns.

## Emergency and upgrade posture

Stage 3 deliberately does not add a pause switch, upgrade proxy, or mutable risk administrator. Those controls would add privileged paths absent from the source behavior and require their own governance model. A defect therefore requires stopping frontend access, warning users, deploying corrected contracts, and planning an explicit migration. This immutability trade-off must be reconsidered before any public testnet with persistent value.

## Testnet blockers

- Green unit, boundary, fuzz/invariant, gas, dependency, Solhint, and Slither gates.
- Production oracle adapter with decimal, heartbeat, deviation, and sequencer tests.
- Independent review of solvency, interest economics, liquidation incentives, and direct-burn semantics.
- Named deployment owner, multisig/timelock decision, verified bytecode, and reproducible manifest.
- Incident communication, migration, monitoring, and rollback procedures.
