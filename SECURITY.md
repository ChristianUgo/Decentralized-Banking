# Security policy

## Project status

This project is under active development. It has not been audited and is not approved for mainnet or real-value use.

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

