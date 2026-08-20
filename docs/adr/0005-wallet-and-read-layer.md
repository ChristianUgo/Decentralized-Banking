# ADR 0005: Wallet lifecycle and read-layer boundary

## Status

Accepted for Stage 4.

## Context

The interface needs reliable wallet detection and contract reads without introducing transaction signing before Stage 5. The application is JavaScript-only, contract addresses and ABIs are generated deployment inputs, and browser wallet state cannot be safely resolved during server rendering.

## Decision

- Keep App Router pages and layouts server-rendered, with one `WalletProvider` client boundary around interactive application chrome.
- Model injected EIP-1193 wallet state in a framework-independent external store. Initialization uses `eth_accounts`, so page loads never trigger a permission prompt. Connection is the only path that calls `eth_requestAccounts`.
- Treat disconnect as a local UI action because injected wallets do not expose a standard programmatic disconnect method.
- Require chain 31337 for account reads and offer EIP-3326/EIP-3085 switch/add requests for the documented local network.
- Use ethers 6.17.0 with a read-only JSON-RPC provider for protocol data. Wallet providers authorize identity; they do not become an implicit source of contract truth.
- Validate deployed bytecode before the first read, then resolve independent contract calls concurrently and refresh every 15 seconds or on demand.
- Keep fixed-point values as `bigint` until presentation. No financial calculation uses JavaScript floating point.
- Display protocol-wide reads without a wallet. Display account reads only when a connected wallet is on the supported chain.

## Consequences

- Wallet, wrong-network, rejected-request, missing-wallet, missing-RPC, and missing-deployment states are explicit and testable.
- Server and client HTML begin from the same deterministic wallet snapshot, preventing browser-only hydration drift.
- The interface supports injected EIP-1193 wallets but does not yet provide WalletConnect or mobile deep links.
- Public deployments must set `NEXT_PUBLIC_RPC_URL` to a reviewed endpoint and regenerate addresses from a verified deployment manifest.
- Stage 4 is read-only. Transaction simulation, signature state, receipts, reverts, and user actions remain Stage 5 work.
