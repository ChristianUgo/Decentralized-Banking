# Contracts

Stage 2 implements the source project's protocol as five explicit modules and matching interfaces.

| Contract | Responsibility | Mutability/authority |
| --- | --- | --- |
| `CollateralVault` | Custodies native ETH and tracks collateral per account | Owner assigns LendingPool exactly once; only that pool can deposit or withdraw |
| `Stablecoin` | ERC-20 debt asset named Decentralized Bank USD (`DBUSD`) | Owner assigns LendingPool exactly once; only that pool can mint or burn |
| `InterestEngine` | Pure utilization and simple-interest calculations | Stateless and immutable |
| `PriceOracle` | 8-decimal ETH/USD price with freshness validation | Owner-updated local/test implementation only |
| `LendingPool` | Accounts, collateral/debt rules, interest, repayment and liquidation | Module addresses and risk parameters are immutable |

## Risk parameters

| Parameter | Value |
| --- | ---: |
| Required collateral ratio | 150% |
| Liquidation threshold | 85% |
| Liquidation bonus | 7% |
| Liquidation close factor | 100% |
| Minimum residual debt | 0.01 DBUSD |
| Base / kink / maximum borrow APR | 2% / 10% / 18% |
| Optimal utilization | 80% |

All monetary values use 18 decimals except the local oracle price, which uses 8. Contract arithmetic normalizes price data before collateral, borrowing-power, and health-factor calculations.

## Deployment topology

The deployment script creates the oracle, interest engine, vault, stablecoin, and pool, then permanently assigns the pool as the vault controller and DBUSD minter/burner. This explicit two-step wiring avoids predicted-address deployment assumptions.

The included oracle is intentionally mutable so tests can exercise health and liquidation transitions. It is not suitable for production; a reviewed decentralized oracle adapter is a release blocker.
