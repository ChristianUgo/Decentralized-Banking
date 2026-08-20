# Security policy

## Project status

This project is under active development. Stage 3 contracts are intended only for local development. They have not been audited and are not approved for testnet, mainnet or real-value use.

## Protocol trust assumptions and Stage 3 controls

- The owner of the local `PriceOracle` is fully trusted and can change every position's borrowing power and liquidation status.
- The oracle freshness window is 24 hours in the local deployment; consuming stale prices reverts.
- The LendingPool address is assigned exactly once to the vault and stablecoin, after which the owner cannot replace it.
- The LendingPool may burn DBUSD directly from a repayer or liquidator without ERC-20 allowance, matching the source application's transaction flow.
- Interest accrues lazily on account actions. Stored aggregate debt can lag unmaterialized interest for inactive accounts.
- A 100% close factor preserves the source's one-click liquidation behavior and increases execution and slippage exposure versus partial liquidation.
- Native ETH transfers use checks-effects-interactions plus reentrancy guards.
- Stage 3 tests rejected ETH recipients and active reentrancy attempts, including full accounting rollback.
- Seeded property tests reconcile collateral, debt, DBUSD supply and health across two-account action sequences.
- Solhint is a zero-warning local gate; Slither findings of medium severity or higher fail CI.
- Gas regression ceilings are executable and every optimization requires recorded before/after evidence.

See the [Stage 3 threat model](docs/security/threat-model.md), [static-analysis policy](docs/security/static-analysis.md), and [gas baseline](docs/security/gas-baseline.md).

## Stage 4 wallet and read-layer assumptions

- Wallet discovery is limited to an injected EIP-1193 provider. The application never requests accounts until the user selects Connect.
- The browser wallet remains responsible for account authorization and network approval. Local disconnect does not revoke permissions inside the wallet.
- Account reads are shown only on the supported generated chain ID. Protocol-wide reads use the configured public RPC endpoint and validate deployed bytecode before the first snapshot.
- RPC responses are availability inputs, not authorization. Protocol risk enforcement remains in Solidity.
- Stage 4 contains no transaction preparation, simulation, signature or broadcast path.
- `NEXT_PUBLIC_RPC_URL` is public by definition and must never contain a secret provider credential intended to remain confidential.

See [ADR 0005](docs/adr/0005-wallet-and-read-layer.md) for the detailed boundary and trade-offs.

## Stage 5 transaction assumptions

- Write actions require a supported-chain wallet, exact base-unit input validation, a successful static-call preflight and explicit final review.
- Preflight and UI impact values are estimates. Contracts remain authoritative if oracle price, lazy interest, balances or transaction ordering change before execution.
- The UI treats a transaction as successful only after a receipt with status `1`; a submitted hash is never described as finality.
- Account or chain changes invalidate prepared transactions and require a new review.
- Repayment and liquidation intentionally do not request ERC-20 approval because the permanently assigned LendingPool burns DBUSD directly from the caller.

See [ADR 0006](docs/adr/0006-transaction-lifecycle-and-preflight.md) for the shared write lifecycle.

## Stage 6 interface assumptions

- Responsive and accessibility behavior improves access to risk information but is not a protocol security boundary.
- Transaction state, warnings, and position health use visible text and programmatic status in addition to color.
- The interface targets WCAG 2.2 AA practices but has not received an independent accessibility audit or certification.
- Contract checks remain authoritative if a browser, assistive technology, translation, or display setting presents stale or incomplete preview information.

See [ADR 0007](docs/adr/0007-responsive-and-accessible-interface.md) and the [accessibility acceptance guide](docs/accessibility.md).

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability involving loss of funds, authorization, oracle manipulation, reentrancy, arithmetic, liquidation or secret exposure. Contact the repository owner privately with:

- affected commit and component;
- reproduction steps or proof of concept;
- expected and observed behavior;
- potential impact;
- suggested mitigation, if known.

The owner should acknowledge a report within three business days. Public disclosure should wait until a fix and migration plan are available.

## Release security gate

Before any testnet release, the project must have:

- contract unit and boundary tests;
- collateral/debt invariants and fuzz coverage;
- access-control and reentrancy review;
- oracle decimal and freshness tests;
- dependency and static-analysis checks;
- documented deployment addresses and parameters.

Mainnet consideration additionally requires an independent audit, threat model, emergency procedures and named operational ownership.
