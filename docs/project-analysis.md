# Aegis Bank final project analysis

This analysis describes the shipped `v1.0.0` release, not an aspirational design. Aegis Bank is a public Ethereum Sepolia demonstration of a non-custodial, overcollateralized lending protocol. Users deposit ETH, borrow the protocol-issued DBUSD token, repay debt and accrued interest, withdraw collateral when the remaining position is safe, and inspect or liquidate unhealthy positions.

The frontend is live at [decentralized-banking.vercel.app](https://decentralized-banking.vercel.app), the source is in the [GitHub repository](https://github.com/ChristianUgo/Decentralized-Banking), and the guarded release is [v1.0.0](https://github.com/ChristianUgo/Decentralized-Banking/releases/tag/v1.0.0).

> **Scope:** “Production” means the hosted frontend is release-controlled and publicly accessible. The contracts are unaudited, use an owner-updated demonstration oracle, and are not approved for mainnet or real funds.

## Executive assessment

The project meets the functional baseline in the source document and improves the original tutorial architecture in four material ways:

1. Financial responsibilities are separated across five narrowly scoped contracts with permanent authority wiring.
2. Every write uses a consistent validate → simulate → review → sign → submit → confirm → refresh lifecycle.
3. Financial calculations remain in integer base units and are tested at unit, fuzz, invariant, browser, accessibility, and release boundaries.
4. The public artifact is tied to a merged commit, a Sepolia manifest, a Vercel health response, and a guarded semantic GitHub release.

The result is strong portfolio evidence of full-stack Web3 engineering. It is not a production lending market: oracle decentralization, audits, governance, stablecoin economics, monitoring, and operational controls remain intentionally out of scope.

## Source-to-release traceability

| Source requirement | Shipped implementation | Evidence |
| --- | --- | --- |
| Landing and protocol education | Original responsive Aegis Bank landing page with live read-only position preview | `/`, Playwright production route checks |
| Wallet connect, account display, copy, disconnect, and network handling | Injected EIP-1193 wallet store with permission-based connection, local disconnect, account/chain listeners, and switch/add-network requests | `frontend/src/lib/wallet-store.js`, `WalletProvider.js` |
| Dashboard and protocol statistics | On-chain collateral, debt, balance, health, borrowing power, utilization, APR, supply, price, and block reads | `/dashboard`, `useProtocolReads.js`, `protocol-client.js` |
| Deposit ETH | Amount validation, impact preview, exact call simulation, fee estimate, signature, receipt, and refreshed reads | `/deposit`; confirmed Sepolia deposit transaction |
| Safe collateral withdrawal | Post-withdraw capacity preview plus contract-level safety enforcement | `/deposit`; confirmed Sepolia withdrawal transaction |
| Borrow protocol stablecoin | Capacity validation and projected debt/health before DBUSD minting | `/borrow`; confirmed Sepolia borrow transaction |
| Partial and full repayment | Debt/balance validation and direct protocol-authorized DBUSD burn | `/repay`; confirmed partial repayment transaction; contract tests cover full repayment |
| Inspect and liquidate unhealthy accounts | Checksum address validation, eligibility, repayable debt and collateral-reward preview, explicit risk acknowledgement | `/liquidity`; automated liquidation and boundary suites |
| Transaction feedback | Preparing, review, signing, submitted, confirmed, rejected/reverted states with explorer hash | Shared `TransactionProvider` and transaction components |
| Modern responsive UI/UX | Custom Tailwind design system, mobile navigation, clear numeric hierarchy, visible focus, reduced-motion and contrast support | Route screenshots, accessibility suite, `docs/accessibility.md` |
| Root protocol plus nested frontend structure | Hardhat/Solidity at root; Next.js App Router under `frontend/src/app` | Repository tree and workspace configuration |
| Public testnet and repository handoff | Verified Sepolia contracts, committed manifest, Vercel deployment, CI gates, semantic release, and documentation | `deployments/11155111.json`, release workflow, `v1.0.0` |

The route remains `/liquidity` for source compatibility, while the visible interface correctly calls the action “liquidation.” A debt-free health factor is represented internally by the maximum unsigned integer and displayed as “No debt” rather than a confusing infinity symbol.

## Architecture

```text
Browser / MetaMask
       │ EIP-1193 identity, chain requests, signatures
       ▼
Next.js App Router + React client boundaries
       │ ethers read provider and signer contracts
       ▼
LendingPool ─────────────── InterestEngine
    │        coordinates      rate and interest math
    ├── CollateralVault      ETH custody
    ├── Stablecoin           DBUSD mint/burn
    └── PriceOracle          8-decimal ETH/USD price
       │
       ▼
Ethereum Sepolia + Etherscan event/transaction evidence
```

There is no application database for balances or positions. The browser reads contract state through an RPC endpoint, and MetaMask signs value-moving transactions. The frontend mirrors selected formulas only to explain projected impact; the contracts re-evaluate every rule during execution.

### Contract responsibilities

- `CollateralVault` holds native ETH, tracks per-account and total deposits, and releases value only when the permanently configured LendingPool instructs it.
- `Stablecoin` is the 18-decimal Decentralized Bank USD (`DBUSD`) ERC-20. Only the permanently configured LendingPool can mint or burn it.
- `InterestEngine` is stateless. It calculates utilization, a kinked variable APR, and simple per-second interest.
- `PriceOracle` stores an owner-updated, 8-decimal ETH/USD price and rejects data older than 24 hours in the Sepolia deployment.
- `LendingPool` owns account debt state and coordinates deposits, withdrawals, borrowing, repayment, interest accrual, health checks, and liquidation.

Module addresses and risk constants are not upgradeable. The vault and token LendingPool authority can be set only once. This reduces mutable authority but means a defective deployment must be replaced rather than upgraded.

## Protocol mathematics

All percentages and financial amounts use 18-decimal fixed-point units (`WAD = 1e18`). Oracle values arrive with 8 decimals and are normalized to 18 decimals. OpenZeppelin `Math.mulDiv` is used where multiplication and division need explicit precision.

Let:

- `C` be deposited ETH in 18-decimal units;
- `P` be the normalized ETH/USD price;
- `D` be current DBUSD debt including previewed interest;
- `U` be protocol utilization;
- `t` be elapsed seconds.

The core relationships are:

```text
collateral value = C × P / 1e18
maximum debt     = collateral value / 1.50
borrowing power  = max(maximum debt - D, 0)
health factor    = collateral value × 0.85 / D
utilization      = min(total debt / total collateral value, 1.00)
interest         = D × annual rate × t / (1e18 × 365 days)
```

Debt-free accounts have maximal health internally. An account is liquidatable only when debt is non-zero and its health factor is below `1.00`.

The variable annual borrow rate is:

- from 0% to 80% utilization: `2% + U × 10%`, producing 2% at zero and 10% at 80%;
- above 80%: `10% + (U - 80%) × 40%`, producing 18% at 100%.

Interest is simple and accrues lazily when a debt-sensitive account action occurs. A read can preview unmaterialized interest, but aggregate stored debt may exclude interest for inactive accounts until they are touched.

Liquidation has an 85% health threshold, a 7% collateral bonus, and a 100% close factor. The repay amount is limited by both debt and collateral available after accounting for the bonus. USD-to-ETH conversion rounds the base collateral upward, and seized collateral is capped at the borrower’s available collateral.

## Functional behavior and transaction lifecycle

Every value-moving page shares the same safety-oriented interaction model:

1. Validate account, chain, address, numeric format, balances, capacity, dust, and projected safety in the UI.
2. Convert decimal input to 18-decimal `bigint`; never use JavaScript floating point for protocol math.
3. Simulate the exact LendingPool method with `staticCall`.
4. Estimate gas and the maximum fee when the provider supplies fee data.
5. Present a review containing the action and projected position.
6. Confirm that the signer still matches the reviewed account, then request the MetaMask signature.
7. Show the public transaction hash while pending.
8. Treat receipt status `1` as confirmation truth, then refresh affected on-chain reads.

Prepared transactions are invalidated if the account or chain changes. Simulation reduces deterministic failures, but it cannot reserve price, interest, nonce, gas, balance, or ordering; the contract remains the final authority.

Repayment and liquidation deliberately do not use ERC-20 allowances. The LendingPool is DBUSD’s exclusive burner and burns from the caller during those actions. This preserves the source workflow and removes an approval transaction, but differs from many lending protocols and must be explained to integrators.

## UI/UX and accessibility analysis

The interface preserves the source capabilities without copying its appearance. It uses a custom dark, high-contrast financial workspace built from vanilla Tailwind utilities and project-owned React components.

The main design decisions are:

- risk and post-transaction impact appear before decorative information;
- financial values use strong hierarchy and overflow-safe formatting;
- disconnected, wrong-network, loading, empty, pending, confirmed, rejected, reverted, RPC-failure, and stale-oracle states are explicit;
- wallet-dependent code is isolated in client components while public content remains compatible with server rendering;
- keyboard focus, minimum touch targets, live status announcements, named health meters, reduced-motion, increased-contrast, and forced-color preferences are supported.

Automated Axe scans reported zero WCAG A/AA violations across all public production routes. One contrast check per route remained “incomplete” because automated tooling could not resolve gradient backgrounds; that is a manual-review item, not certification.

## Security posture

### Controls implemented

- `ReentrancyGuard` protects value-moving LendingPool and vault paths.
- State changes precede external ETH transfer in the withdrawal flow, and a failed transfer reverts the transaction.
- Only the permanently wired LendingPool can move vault balances or mint/burn DBUSD.
- Constructors and one-time wiring reject zero addresses and non-contract modules.
- Unsafe withdrawals, excess borrowing, debt below `0.01 DBUSD`, zero amounts, healthy liquidation, and invalid oracle values revert with custom errors.
- Oracle freshness is enforced on-chain; a stale price fails closed.
- Liquidation uses a single normalized price snapshot so all checks in one call share the same price.
- Unit, adversarial receiver, boundary, fuzz, and stateful invariant tests exercise the protocol.
- Solhint runs with zero warnings locally, and pinned Slither analysis fails CI on medium-or-higher findings.
- Secrets are excluded from manifests and the frontend; deployment keys are temporary release-owner inputs.

### Trust boundaries and limitations

- The oracle owner can change the price used for every position. This is acceptable only for the demonstration.
- The contracts have not received an independent audit or economic review.
- DBUSD is a debt token named as a stablecoin; the project does not implement external redemption, reserves, market-making, or a mechanism that guarantees a one-dollar market price.
- A 100% close factor can produce large liquidations and needs market/liquidity evidence before real use.
- Direct burn authority is simpler but is not the conventional allowance pattern expected by all integrations.
- Contracts are non-upgradeable, and there is no pause mechanism, multisig, timelock, governance system, or emergency response module.
- Shared RPC infrastructure is an availability dependency. Incorrect reads cannot rewrite chain state, but outages can make the interface unavailable.
- Lazy accrual means `totalBorrowed` can temporarily omit unmaterialized interest for inactive accounts.
- Frontend validation and simulation are usability controls, not replacements for contract enforcement.

## Sepolia and provider decisions

Sepolia was selected because it exercises public Ethereum wallet, gas, explorer, verification, and confirmation behavior without placing real value at risk. The dedicated MetaMask Account 4 received Sepolia ETH from a faucet; that valueless test asset paid deployment and smoke-test gas and also served as demonstration collateral.

Alchemy was evaluated during deployment setup because it provides a supported Ethereum Sepolia HTTPS RPC endpoint, application-level request metrics, quotas, logs, and a path to dedicated support. The final browser release uses `https://ethereum-sepolia-rpc.publicnode.com` because it is keyless and avoids placing a project-specific provider key in a public client bundle. This is an operational choice, not a contract change: the same bytecode and addresses are available through any healthy Sepolia RPC.

The trade-off is explicit. PublicNode is simpler for a portfolio demonstration but offers no project-specific quota or availability commitment. A serious deployment should use authenticated provider infrastructure with monitored quotas, fallback RPCs, and alerting; Alchemy remains a reasonable option for that role.

## Test and quality evidence

The complete `pnpm check` gate covers Solidity and frontend linting, 31 contract tests, 3 release-validation tests, 33 frontend unit tests, the Next.js production build, Solidity compilation, deterministic gas ceilings, and a high-severity dependency audit. CI additionally runs Slither and a real browser journey against a fresh local Hardhat deployment.

The browser journey uses a Playwright-injected EIP-1193 wallet and still executes the production ethers flow: reads, simulation, gas estimate, submission, receipt, and refresh. It covers deposit, borrow, repay, and safe withdrawal. Separate tests cover liquidation execution and boundaries. Accessibility and narrow-viewport checks visit every public route.

The dependency audit reported one low-severity advisory and no high-severity vulnerability at release time. These counts are release evidence, not a permanent safety guarantee.

### Deterministic gas regression baseline

| Operation | Gas used | Review ceiling |
| --- | ---: | ---: |
| Deposit | 105,512 | 140,000 |
| Borrow | 155,126 | 200,000 |
| Partial repay | 80,204 | 110,000 |
| Safe withdrawal | 91,649 | 125,000 |
| Oracle update | 35,377 | 50,000 |
| Collateral-limited liquidation | 103,872 | 140,000 |

The measured liquidation optimization caches validated oracle decimals and reuses one normalized price snapshot. It reduced the deterministic liquidation baseline by 4.69% without storage packing or opaque arithmetic. These figures are regression thresholds, not Sepolia fee predictions.

## Deployment and release evidence

- Network: Ethereum Sepolia (`11155111`)
- Release commit: [`20f78395fb22e1cd51499b4ea48374cb5eb7988b`](https://github.com/ChristianUgo/Decentralized-Banking/commit/20f78395fb22e1cd51499b4ea48374cb5eb7988b)
- Release: [Aegis Bank v1.0.0](https://github.com/ChristianUgo/Decentralized-Banking/releases/tag/v1.0.0)
- Production URL: [decentralized-banking.vercel.app](https://decentralized-banking.vercel.app)
- Release workflow: [successful guarded run](https://github.com/ChristianUgo/Decentralized-Banking/actions/runs/32754206681)
- Contract manifest: [`deployments/11155111.json`](../deployments/11155111.json)
- Manual write evidence: [`docs/sepolia-smoke-test.md`](sepolia-smoke-test.md)
- Full deployment evidence: [`docs/production-deployment-evidence.md`](production-deployment-evidence.md)

All five contract sources are verified on Sepolia Etherscan. The final manual position demonstrated deposit, borrow, partial repayment, and safe withdrawal, ending at approximately `0.0005 ETH` collateral, `0.25 DBUSD` debt, and a `3.39` health factor. Healthy-position liquidation remained disabled as designed; full liquidation is covered by automated tests rather than an intentionally manipulated public position.

## Engineering workflow assessment

The repository was delivered as numbered stages with Conventional Commit messages, focused pull requests, required CI, explicit security/gas impact, and squash merges. Public contract artifacts are generated from one deployment manifest. The release workflow refuses a non-semantic tag, a non-`main` ref, an existing release, an invalid Sepolia manifest, unsafe public URLs, or a live deployment whose `/health` commit differs from the release commit.

This gives reviewers a clean history and traceable evidence instead of a single oversized submission. The remaining delivery limitation is that Vercel’s automatic Git integration did not resolve the nested frontend project during the first release; the verified deployment was made with the pinned Vercel CLI and explicit commit metadata.

## Known gaps and prioritized roadmap

### P0 — required before real value

- replace the manual oracle with independently reviewed, decentralized price feeds and robust fallback/staleness logic;
- commission independent smart-contract, frontend, and economic audits;
- define DBUSD redemption/peg mechanics, liquidity assumptions, bad-debt handling, and insolvency behavior;
- move privileged operations to a multisig and timelock with a documented emergency process;
- review close factor, liquidation incentive, minimum debt, rate curve, and oracle assumptions through simulation and market evidence;
- create a mainnet-specific threat model and staged-value rollout.

### P1 — release reliability

- add authenticated primary and fallback RPC providers with quota, latency, and error monitoring;
- add Vercel/runtime error drains, client-safe telemetry, and alerts without collecting sensitive wallet data;
- complete Git-integrated preview and `main` deployments or formalize token-based deployment in CI;
- update pinned GitHub Actions before the platform’s Node runtime deprecation becomes blocking;
- add a repeatable testnet oracle keeper or clearly owned refresh runbook.

### P2 — product expansion

- index events for transaction history and account activity without treating the indexer as financial truth;
- add multi-collateral risk isolation, governance, parameter dashboards, and richer analytics;
- add WalletConnect/mobile support and broader wallet/browser testing;
- perform manual screen-reader, zoom, contrast, and usability studies beyond automated accessibility checks.

## Final verdict

Aegis Bank is complete for its declared purpose: a modern, public, recruiter-verifiable Sepolia portfolio project demonstrating protocol design, smart-contract security boundaries, Web3 frontend state, transaction UX, testing, CI, deployment, and release discipline. Its strongest feature is not a single contract or screen; it is the traceable path from source requirement to tested contract behavior to a commit-addressed live release.

The correct interview position is confident but precise: this is a hardened demonstration, not an audited bank or production lending protocol.
