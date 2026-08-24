# Sepolia protocol smoke-test evidence

This evidence records the manual browser-wallet test completed on 2026-08-24 against the committed Sepolia deployment. It demonstrates testnet behavior only; the contracts remain unaudited and unsuitable for real funds or mainnet.

## Test context

- Chain: Ethereum Sepolia (`11155111`)
- Test account: [`0x08d7d4e993b15E163BA616ddfd4b6e52b52967Fa`](https://sepolia.etherscan.io/address/0x08d7d4e993b15E163BA616ddfd4b6e52b52967Fa)
- LendingPool: [`0x2E1cef27de10A2e93567491266651c0c17ABB1b0`](https://sepolia.etherscan.io/address/0x2E1cef27de10A2e93567491266651c0c17ABB1b0)
- Frontend: local Next.js release candidate with MetaMask Account 4
- Read endpoint: browser-safe PublicNode Sepolia RPC; Alchemy was evaluated, but the keyless endpoint reduced local secret-handling friction. Shared public RPC availability and throttling remain explicit trade-offs.

## Confirmed transactions

| Action | Input | Result | Public evidence |
| --- | ---: | --- | --- |
| Deposit | `0.001 ETH` | Collateral increased to `0.001 ETH` | [transaction](https://sepolia.etherscan.io/tx/0x20ebc72e1c075f6ac92e71e261f34e69dbdb27b0d4ac51d3e22ead55cd57a78e) |
| Borrow | `0.5 DBUSD` | Debt and wallet balance increased to `0.5 DBUSD`; health factor `3.4` | [transaction](https://sepolia.etherscan.io/tx/0x8afff97dab8d604eb00f4cd8e198aee7c3453edbf284ac452aee58891ca9fbb5) |
| Repay | `0.25 DBUSD` | Debt and wallet balance reduced to approximately `0.25 DBUSD`; health factor `6.79` | [transaction](https://sepolia.etherscan.io/tx/0xb6551aef1277de8c316e9dccf5e27107003ce636d0d0339916790cbdaf8af1e2) |
| Withdraw | `0.0005 ETH` | Collateral reduced to `0.0005 ETH`; health factor remained safe at `3.39` | [transaction](https://sepolia.etherscan.io/tx/0x976566af71714bcca628f9a7153a51303752303ca073f15b8b0eec003617c0bd) |

The final observed position retained `0.0005 ETH` collateral and approximately `0.25 DBUSD` debt. Values can drift slightly as lazy interest accrues.

## Read and safety checks

- The dashboard resolved live protocol totals, block height, the `2%` base borrow APR and the `$2,000` manual oracle price.
- The connected account resolved collateral, debt, DBUSD balance, available credit and health factor from the deployed contracts.
- The liquidation workspace classified the final `3.39` health-factor position as **Healthy / ineligible** and kept its transaction control disabled.
- A full public-testnet liquidation was not executed. Liquidation execution, boundary behavior and stale-oracle rejection remain covered by the automated contract suites.

## Oracle and RPC operations

- The owner refreshed the manual oracle to `$2,000` in [this transaction](https://sepolia.etherscan.io/tx/0x10ead95a50663bae5dc1bbe106156db7f34afe58909aa7278e0943dbbbe0bd63).
- The oracle expires after 24 hours by design. A stale price blocks reads and value-moving actions until the dedicated test owner publishes a fresh value.
- The public RPC failed briefly when the tester's internet connection dropped. The position remained on-chain and the interface recovered after connectivity returned.

## Release implications

This stage changes frontend diagnostics and evidence only. It does not alter contract bytecode, storage, permissions, gas costs or deployed addresses. Production hosting must repeat the route, console, wallet and transaction checks against the final HTTPS deployment.
