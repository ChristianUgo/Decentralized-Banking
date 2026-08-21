# ADR 0008: Integrated QA and testnet release boundary

- Status: Accepted
- Date: 2026-08-20

## Context

Unit, invariant, gas, and static-analysis checks cover isolated protocol and frontend behavior, but they do not prove that the browser, injected wallet, generated deployment manifest, RPC node, and contracts work together. A public testnet release also needs repeatable configuration and evidence without turning deployment credentials into application state.

## Decision

Stage 7 adds a serial Playwright suite backed by a fresh local Hardhat node and deployment. Its injected EIP-1193 QA wallet forwards JSON-RPC requests to unlocked local accounts, exercising the production ethers read, preflight, signing, receipt, and refresh path. The primary journey deposits collateral, borrows DBUSD, repays debt, and safely withdraws collateral. Axe checks all public routes against automated WCAG A/AA rules, and narrow-viewport checks guard against horizontal overflow.

Ethereum Sepolia is the only configured public testnet. Hardhat resolves its RPC URL and a dedicated deployer key at command execution. The generated chain manifest remains the single source for frontend addresses. An independent read-only verifier checks the chain ID, bytecode, module topology, protocol authorities, and oracle owner after deployment.

The deployment command and live broadcast are deliberately separate from CI. CI must never receive a deployer key merely to validate a pull request. A human release owner funds a dedicated account with test ETH, runs the documented preflight and deployment, records public evidence, and removes the key from the shell afterward.

## Consequences

- Browser QA now tests the real application boundary instead of mocked React state.
- Each run starts from deterministic contracts and uses no public RPC quota or test funds.
- Automated accessibility checks are broad regression gates, not a substitute for keyboard, screen-reader, zoom, or human usability review.
- Sepolia proves release mechanics only. The owner-updated oracle, unaudited contracts, and mutable operational key remain unsuitable for mainnet or real value.
- Contracts are not upgradeable. A failed testnet release is abandoned and redeployed with a new manifest rather than mutated through a proxy.
