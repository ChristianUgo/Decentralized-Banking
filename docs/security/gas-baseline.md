# Stage 3 gas baseline

- Date: 2026-08-17
- Network: ephemeral Hardhat chain, Prague EVM target
- Compiler: Solidity 0.8.30, optimizer enabled with 200 runs
- Tooling: Hardhat 3.13.0 and ethers 6.17.0

`pnpm gas:report` deploys a clean protocol, executes a deterministic banking scenario, prints transaction receipts, and fails when an operation exceeds its review ceiling.

| Operation | Stage 2 baseline | Stage 3 result | Change | Review ceiling |
| --- | ---: | ---: | ---: | ---: |
| Deposit | 105,512 | 105,512 | 0 | 140,000 |
| Borrow | 155,719 | 155,126 | -593 (-0.38%) | 200,000 |
| Partial repay | 80,758 | 80,204 | -554 (-0.69%) | 110,000 |
| Safe withdrawal | 92,796 | 91,649 | -1,147 (-1.24%) | 125,000 |
| Oracle update | 35,377 | 35,377 | 0 | 50,000 |
| Collateral-limited liquidation | 108,978 | 103,872 | -5,106 (-4.69%) | 140,000 |

## Optimization decision

Stage 2 repeatedly read and normalized the same oracle price during liquidation. Stage 3 stores the validated oracle decimal count as an immutable and takes one normalized price snapshot for health, collateral-limit, and seizure calculations. The change reduces external calls, improves fixed-point precision by using one `mulDiv`, and keeps all risk checks on the same price value.

No storage packing or opaque arithmetic was introduced. Correctness and consistent rounding take priority over further gas reduction.

## Interpretation

These numbers are regression evidence, not fee predictions. Actual cost depends on the deployed EVM, calldata, state warmth, compiler changes, and network base/priority fees. Any ceiling increase requires a PR explanation and a fresh before/after report.
