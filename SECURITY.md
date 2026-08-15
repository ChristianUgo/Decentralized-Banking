# Security policy

## Project status

This project is under active development. Stage 2 contracts are intended only for local development. They have not been audited and are not approved for testnet, mainnet or real-value use.

## Stage 2 trust assumptions

- The owner of the local `PriceOracle` is fully trusted and can change every position's borrowing power and liquidation status.
- The oracle freshness window is 24 hours in the local deployment; consuming stale prices reverts.
- The LendingPool address is assigned exactly once to the vault and stablecoin, after which the owner cannot replace it.
- The LendingPool may burn DBUSD directly from a repayer or liquidator without ERC-20 allowance, matching the source application's transaction flow.
- Interest accrues lazily on account actions. Stored aggregate debt can lag unmaterialized interest for inactive accounts.
- A 100% close factor preserves the source's one-click liquidation behavior and increases execution and slippage exposure versus partial liquidation.
- Native ETH transfers use checks-effects-interactions plus reentrancy guards. Stage 3 still needs malicious-recipient and stateful invariant coverage.

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
