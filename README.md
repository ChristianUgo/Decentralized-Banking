# Aegis Bank — Decentralized Banking Protocol

Aegis Bank is a non-custodial lending application where users will deposit ETH collateral, borrow a protocol-issued stablecoin, repay debt and interest, withdraw safe collateral, monitor position health, and liquidate eligible unhealthy positions for a bonus.

The project is being implemented stage by stage from the approved implementation plan. Stage 1 establishes a production-minded repository and a modern frontend foundation; financial smart-contract behavior begins in Stage 2.

> **Security status:** Foundation only. No deployed contracts exist yet. This repository is not audited and must not be used with real funds.

## Current status

| Stage | Scope | Status |
| --- | --- | --- |
| 1 | Repository, Next.js/Tailwind foundation, design primitives, CI and contribution standards | Ready for review |
| 2 | Solidity interfaces and protocol contracts | Not started |
| 3 | Contract hardening, invariants, fuzzing and deployment workflow | Not started |
| 4 | Wallet connection and on-chain read layer | Not started |
| 5 | Deposit, withdraw, borrow, repay and liquidation transactions | Not started |
| 6 | Complete responsive UI/UX and accessibility | Not started |
| 7 | Integrated QA and testnet release | Not started |
| 8 | GitHub release and production frontend deployment | Not started |
| 9 | Interview guide based on the deployed release | Not started |

## Technology

| Area | Choice | Why |
| --- | --- | --- |
| Web application | Next.js 16.3.1 App Router | Current stable framework, server-first routing and a strong production build pipeline |
| UI language | React 19.2.8 with JavaScript/JSX | Meets the no-TypeScript requirement while keeping component boundaries explicit |
| Styling | Tailwind CSS 4.3.3 | Low-level utilities enable a fully custom visual system without a component framework |
| Smart-contract tooling | Hardhat 3.13.0 | Compilation, local network, test and deployment foundation for Solidity |
| Solidity baseline | 0.8.30 | Explicit compiler pin with checked arithmetic and optimizer support; revisited before protocol implementation |
| Unit testing | Vitest | Fast, focused JavaScript tests with a small setup surface |
| Package management | pnpm 11.19.0 workspace | Fast deterministic installs with one lockfile for protocol and frontend |
| Automation | GitHub Actions | Reproducible lint, test, build and compile checks on pull requests |

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
│   └── src/lib/            # Shared navigation and domain helpers
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

### Useful commands

```bash
pnpm lint             # Frontend lint rules
pnpm test             # Contract and frontend tests
pnpm build            # Production Next.js build
pnpm compile          # Solidity compilation
pnpm check            # Complete Stage 1 quality gate
```

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

Every optimization must include a before/after gas report and must not weaken access control, oracle validation, arithmetic clarity or invariant coverage.

## Security assumptions and limits

- Stage 1 contains no financial contract implementation.
- Future collateral and debt calculations will use integer base units, never JavaScript floating-point arithmetic.
- Oracle freshness, decimal scaling and manipulation resistance are protocol-critical.
- Healthy positions must never be liquidatable; unsafe withdrawals and over-borrowing must revert.
- Only authorized protocol contracts may mint or burn the stablecoin.
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
