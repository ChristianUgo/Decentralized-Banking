# Aegis Bank — Decentralized Banking Protocol

Aegis Bank is a non-custodial lending application where users will deposit ETH collateral, borrow a protocol-issued stablecoin, repay debt and interest, withdraw safe collateral, monitor position health, and liquidate eligible unhealthy positions for a bonus.

The project is being implemented stage by stage from the approved implementation plan. Stages 1–7 established the frontend foundation, hardened protocol, wallet and transaction journeys, responsive accessibility layer, integrated browser QA, and controlled Sepolia release path. Stage 8 adds the production frontend and GitHub release gate.

> **Security status:** Local-development contracts only. The protocol is unaudited, uses an owner-updated test oracle, and must not be used with real funds.

## Current status

| Stage | Scope | Status |
| --- | --- | --- |
| 1 | Repository, Next.js/Tailwind foundation, design primitives, CI and contribution standards | Complete |
| 2 | Solidity interfaces, protocol contracts, focused tests and local deployment | Complete (PR #6) |
| 3 | Contract hardening, invariants, fuzzing, gas and static analysis | Complete (PR #7) |
| 4 | Wallet connection and on-chain read layer | Complete |
| 5 | Deposit, withdraw, borrow, repay and liquidation transactions | Complete |
| 6 | Complete responsive UI/UX and accessibility | Complete (PR #11) |
| 7 | Integrated QA and testnet release | Complete (PR #12) |
| 8 | GitHub release and production frontend deployment | Ready for review |
| 9 | Interview guide based on the deployed release | Not started |

## Technology

| Area | Choice | Why |
| --- | --- | --- |
| Web application | Next.js 16.3.1 App Router | Current stable framework, server-first routing and a strong production build pipeline |
| UI language | React 19.2.8 with JavaScript/JSX | Meets the no-TypeScript requirement while keeping component boundaries explicit |
| Styling | Tailwind CSS 4.3.3 | Low-level utilities enable a fully custom visual system without a component framework |
| Web3 client | ethers 6.17.0 with EIP-1193 | Small injected-wallet boundary, exact bigint formatting and direct contract reads |
| Smart-contract tooling | Hardhat 3.13.0 | Compilation, local network, test and deployment foundation for Solidity |
| Solidity baseline | 0.8.30 | Explicit compiler pin with checked arithmetic and optimizer support; revisited before protocol implementation |
| Contract library | OpenZeppelin Contracts 5.6.1 | Audited ERC-20, ownership, reentrancy and arithmetic building blocks |
| Unit testing | Mocha/Chai for contracts; Vitest for frontend | Focused JavaScript suites with behavior-specific files |
| Property testing | fast-check 4.9.0 | Seeded interest fuzzing and randomized multi-account action sequences |
| Browser QA | Playwright 1.62.1 with axe-core 4.13.0 | Real wallet/RPC transaction journeys, WCAG regression checks and responsive verification |
| Solidity analysis | Solhint 6.2.4 locally; Slither 0.11.6 in CI | Fast zero-warning feedback plus deeper independent Linux analysis |
| Package management | pnpm 11.19.0 workspace | Fast deterministic installs with one lockfile for protocol and frontend |
| Automation | GitHub Actions | Reproducible lint, test, build and compile checks on pull requests |
| Frontend hosting | Vercel Git integration | Commit-addressable previews, production promotion and fast rollback for the nested Next.js app |
| Release evidence | GitHub Releases and Playwright | A release is published only after manifest, commit, live-route and accessibility verification |

Dependency versions are pinned in `pnpm-lock.yaml`. They are reviewed again at each release instead of floating silently in production.

## Repository structure

```text
.
├── contracts/              # Stage 2 Solidity modules and interfaces
├── scripts/                # Deployment and ABI/address export scripts
├── test/                   # Focused protocol tests
├── frontend/
│   ├── src/app/            # App Router pages
│   ├── src/components/     # Project-owned UI primitives
│   ├── src/hooks/          # On-chain read lifecycle
│   ├── src/providers/      # Client wallet boundary
│   └── src/lib/            # Wallet store, read client and domain helpers
├── docs/adr/               # Architectural decision records
├── .github/                # CI, PR and issue templates
├── hardhat.config.js
└── package.json            # Root scripts and workspace metadata
```

The structure intentionally follows the source project: Solidity and Hardhat remain at the repository root, while the Next.js application lives in `frontend/`.

## Getting started

### Prerequisites

- Node.js 24+
- pnpm 11.19+
- Git

### Install and validate

```bash
pnpm install --frozen-lockfile
pnpm check
```

### Run the frontend

```bash
pnpm dev
```

Open `http://localhost:3000`.

For live local reads, run the local node and deployment in separate terminals before starting the frontend:

```bash
pnpm node:local
pnpm deploy:localhost
pnpm dev
```

Copy `frontend/.env.example` to `frontend/.env.local` only when the RPC endpoint differs from the documented local default. Never commit provider credentials.

### Useful commands

```bash
pnpm lint             # Solidity and frontend lint rules
pnpm test             # Contract and frontend tests
pnpm build            # Production Next.js build
pnpm compile          # Solidity compilation
pnpm deploy:local     # Deploy and export local ABI/address fixtures
pnpm node:local       # Start the persistent local Hardhat JSON-RPC node
pnpm deploy:localhost # Deploy/export against the running local node
pnpm test:invariants  # Seeded fuzz and multi-account invariant suites
pnpm test:e2e         # Local node, deployment, browser banking journey and accessibility checks
pnpm test:a11y        # Focused automated WCAG and narrow-viewport checks
pnpm test:release     # Focused production-manifest and public-URL validation tests
pnpm test:production  # Remote production health, commit, route and accessibility checks
pnpm gas:report       # Gas baseline and regression ceilings
pnpm lint:contracts   # Zero-warning Solidity static/lint gate
pnpm audit:dependencies # High-severity dependency gate
pnpm check            # Complete repository quality gate
pnpm deploy:sepolia   # Explicit public-testnet broadcast; requires dedicated credentials
pnpm verify:sepolia   # Read-only Sepolia bytecode, wiring and ownership verification
pnpm release:validate # Fail closed on stale/local manifests or unsafe production URLs
```

## Stage 2 protocol

The protocol is split into five narrow modules:

- `CollateralVault` holds native ETH and can move it only when instructed by the permanently assigned LendingPool.
- `Stablecoin` is the DBUSD ERC-20; only the permanently assigned LendingPool can mint or burn it.
- `InterestEngine` implements the documented utilization curve: 2% at zero utilization, 10% at 80%, and 18% at 100%.
- `PriceOracle` supplies an 8-decimal ETH/USD price with freshness checks for local development and tests.
- `LendingPool` coordinates deposit, withdrawal, borrowing, repayment, lazy interest accrual, health checks, and liquidation.

The documented risk parameters are 150% collateralization, an 85% liquidation threshold, a 7% liquidation bonus, 100% close factor for source-compatible one-click liquidation, and 0.01 DBUSD minimum residual debt. See [the Stage 2 architecture decision](docs/adr/0003-protocol-architecture-and-risk-parameters.md) for assumptions and trade-offs.

## Stage 3 hardening

Stage 3 adds explicit liquidation and health boundaries, two-account randomized state transitions, fuzzed interest math, malicious ETH receiver coverage, ownership and module validation, dependency auditing, gas ceilings, Solhint, and a pinned Slither version in CI. The protocol now snapshots a normalized oracle price during liquidation and caches validated oracle decimals, reducing liquidation gas by 4.69% in the deterministic baseline.

See the [threat model](docs/security/threat-model.md), [static-analysis policy](docs/security/static-analysis.md), and [gas baseline](docs/security/gas-baseline.md). These controls improve evidence; they do not make the protocol audited or production-safe.

## Stage 4 wallet and read layer

Stage 4 adds injected EIP-1193 wallet detection, permission-based connection, local disconnect, account/network event handling, supported-network switch/add requests, deployment validation, protocol-wide reads without a wallet, connected-account reads, resilient loading/error states, manual refresh and 15-second background refresh.

The dashboard resolves collateral, collateral value, previewed debt, borrowing power, DBUSD balance, health, liquidation eligibility, protocol totals, utilization, borrow APR, oracle price and block height directly from the deployed contracts. Values remain `bigint` until formatting; account state is never mirrored in a database or calculated with floating point.

See [ADR 0005](docs/adr/0005-wallet-and-read-layer.md) for the provider boundary, wallet assumptions and deferred Stage 5 transaction scope.

## Stage 5 transaction layer

Stage 5 replaces every transaction placeholder with a complete local-chain journey. Deposit and withdrawal share a collateral workspace; borrow and repay expose capacity, debt and health previews; liquidation validates a borrower, resolves eligibility, estimates repayable debt and collateral reward, and requires an explicit risk acknowledgement.

Every write follows one state model: validate input, simulate the exact contract call, estimate gas, review, request the wallet signature, expose the submitted hash, wait for a successful receipt, then refresh affected reads. Account or network changes invalidate prepared transactions. DBUSD repayment and liquidation use the protocol's direct-burn authority and do not create a misleading allowance step.

See [ADR 0006](docs/adr/0006-transaction-lifecycle-and-preflight.md) for the transaction boundary, preview assumptions, and confirmation model.

## Stage 6 responsive and accessibility layer

Stage 6 completes the custom responsive shell with active-route navigation, an accessible mobile menu, compact small-screen wallet controls, minimum touch targets, overflow-safe financial values, and an expanded release footer. Banking forms expose persistent instructions and errors, transaction progress uses live status semantics, health is represented as a named meter, and keyboard focus remains visible throughout every journey.

The interface respects reduced-motion, increased-contrast, and forced-color preferences. It targets WCAG 2.2 AA practices but is not certified or independently audited. See [ADR 0007](docs/adr/0007-responsive-and-accessible-interface.md) and the [accessibility acceptance guide](docs/accessibility.md).

## Stage 7 integrated QA and testnet release

Stage 7 runs the complete browser boundary against a fresh Hardhat deployment. A Playwright-controlled EIP-1193 wallet uses unlocked local accounts while the application still performs its production ethers reads, simulations, gas estimates, submissions, receipt checks, and refreshes. The primary journey covers deposit, borrow, repay, and safe withdrawal; axe-core scans every route for automated WCAG A/AA violations and the same routes are checked for narrow-screen overflow.

Sepolia deployment is configured but intentionally manual. A release owner must use a dedicated test-only account, run the full gates, broadcast explicitly, commit the generated public manifest, and capture explorer evidence. The read-only verifier confirms chain identity, bytecode, immutable topology, protocol authorities, and oracle ownership. See [ADR 0008](docs/adr/0008-integrated-qa-and-testnet-release.md) and the [Sepolia release runbook](docs/testnet-release.md).

## Stage 8 production frontend and GitHub release

Stage 8 adds a Vercel-hosted release boundary for the nested Next.js application. Production validation rejects local or stale deployment manifests, mismatched frontend exports, duplicate addresses, missing transaction evidence, insecure public URLs, and non-Sepolia configuration. The deployed `/health` contract exposes the release commit and network without leaking provider or authority details.

GitHub Releases are manual and fail closed. The release workflow runs only from `main`, repeats repository validation, confirms the live deployment serves the exact commit, scans every route for HTTP, runtime and accessibility failures, and then creates a semantic release. See [ADR 0009](docs/adr/0009-production-release-and-hosting.md) and the [production release runbook](docs/production-release.md).

## Product architecture

The final application will have four clear layers:

1. **Presentation:** App Router pages and custom Tailwind components.
2. **Web3 client:** Wallet lifecycle, contract reads/writes, address registry and transaction state.
3. **Protocol:** Collateral vault, stablecoin, interest engine, lending pool and price oracle.
4. **Delivery:** Hardhat scripts, focused tests, CI, testnet verification and release documentation.

Financial state will come from smart contracts. The frontend will not maintain a shadow database that can disagree with on-chain balances.

## Deliberate trade-offs

### JavaScript instead of TypeScript

JavaScript is a project requirement. The trade-off is less compile-time protection around ABI data, token units and transaction results. We compensate with narrow modules, runtime validation, focused tests, lint rules, generated ABI/address manifests and explicit unit-conversion helpers.

### Vanilla Tailwind instead of a component library

Owning the components produces an original, lightweight interface and prevents framework-specific lock-in. The cost is that accessibility and interaction details must be implemented and tested by the project rather than inherited from a mature component library.

### Client wallet access instead of a custodial backend

Direct wallet interaction preserves non-custody and user-controlled signatures. It also introduces wallet, network and RPC variability, so every transaction needs clear review, signature, submitted, confirmed, rejected and reverted states.

### Monorepo workspace

The root protocol and nested frontend match the source project while one pnpm lockfile keeps installs reproducible. Protocol and frontend checks still remain separate so failures are easy to locate.

## Gas optimization policy

Gas work starts after correctness and security invariants are covered. Planned techniques include:

- custom errors instead of long revert strings;
- storage packing only when it stays readable and measurable;
- cached storage reads and minimized redundant writes;
- events for auditability without duplicating query-only storage;
- bounded loops and pull-based value movement;
- immutable addresses where deployment topology permits;
- optimizer settings measured against realistic protocol tests.

Every optimization must include a before/after gas report and must not weaken access control, oracle validation, arithmetic clarity or invariant coverage. Stage 3 establishes executable review ceilings with `pnpm gas:report`.

## Security assumptions and limits

- The code is unaudited. Sepolia is permitted only for a zero-real-value demonstration; mainnet and real funds are explicitly prohibited.
- Collateral and debt calculations use integer base units and OpenZeppelin `Math.mulDiv`, never floating-point arithmetic.
- Oracle freshness, decimal scaling and manipulation resistance are protocol-critical.
- Healthy positions must never be liquidatable; unsafe withdrawals and over-borrowing must revert.
- Only authorized protocol contracts may mint or burn the stablecoin.
- The local manual oracle owner is trusted and can move every account's health factor; a production oracle adapter is mandatory before a public deployment.
- Interest is accrued lazily when an account is touched. Aggregate debt can temporarily exclude interest not yet materialized for inactive accounts.
- Injected wallet availability, authorization and chain switching are controlled by the user's wallet. The Stage 4 local disconnect clears application state but cannot revoke wallet permissions.
- Public RPC endpoints are untrusted availability dependencies. The client verifies contract bytecode at the generated addresses before accepting a read source.
- Stage 5 preflight simulation reduces avoidable wallet prompts but cannot guarantee execution because price, interest, balances, gas and ordering may change before mining.
- A submitted transaction hash is pending evidence, not success. The interface refreshes financial state only after a successful receipt.
- Repayment burns DBUSD directly from the caller under LendingPool authority, matching the source behavior without an allowance transaction.
- Private keys, seed phrases and production secrets must never be committed.
- Mainnet use requires a separate threat model, independent audit, operational controls and explicit approval.

See [SECURITY.md](SECURITY.md) for reporting and release expectations.

## Test philosophy

Tests are intentionally small and behavior-focused. A useful test file should explain one contract or user journey and normally stay below roughly 200 lines. Large scenarios are split by invariant or action rather than collected into a multi-thousand-line suite.

The final quality model includes:

- contract unit tests for each public behavior;
- invariant and fuzz tests for collateral/debt safety;
- frontend unit tests for formatting, validation and transaction state;
- component tests for risk and wallet interactions;
- end-to-end tests for complete banking journeys;
- accessibility and responsive checks.

## Commit and pull-request workflow

Each implementation stage is reviewed before it is committed.

- Branch: `stage/<number>-<short-scope>`
- Commit: Conventional Commit, for example `chore(repo): establish stage 1 foundation`
- PR title: same intent as the commit, without vague wording
- PR body: problem, scope, implementation, tests, security/gas impact, screenshots and follow-ups
- Merge: squash a single-stage PR unless the stage contains independently valuable commits

Commits must not mix generated artifacts, unrelated formatting, protocol behavior and UI redesign. See [the repository strategy ADR](docs/adr/0002-repository-and-delivery-strategy.md).

## Interview guide

The interview guide is intentionally deferred until the GitHub release and production deployment are complete. It will describe the shipped architecture, formulas, security assumptions, gas decisions, tests, trade-offs, deployment evidence and likely technical interview questions.

## License

No license has been selected yet. Treat the repository as all rights reserved until the project owner chooses one.
