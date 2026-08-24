# Aegis Bank interview guide

Use this guide to explain the shipped [`v1.0.0`](https://github.com/ChristianUgo/Decentralized-Banking/releases/tag/v1.0.0) release. Do not memorize every sentence. Learn the decision, trade-off, and evidence behind each answer.

## The answer framework

For most questions, use **Context → Decision → Trade-off → Evidence**:

1. State the user or engineering problem.
2. Explain the design you chose.
3. Name what the choice improves and what it costs.
4. Point to a test, transaction, contract, pull request, or live behavior that proves the claim.

This structure prevents vague answers and makes it easy for an interviewer to ask deeper questions.

## Project explanations

### 30-second version

> Aegis Bank is a non-custodial lending dApp deployed on Ethereum Sepolia. A user deposits ETH as collateral, borrows the protocol’s DBUSD token, repays debt and interest, safely withdraws collateral, and can liquidate unhealthy positions. I built five Solidity modules and a JavaScript Next.js interface that reads on-chain state directly and guides every write through simulation, review, signature, confirmation, and refresh. The release is tested across contracts, invariants, the browser, accessibility, CI, and a commit-verified Vercel deployment. It is an unaudited testnet demonstration, not a real-value protocol.

### Two-minute version

> I rebuilt a decentralized banking tutorial into an original, recruiter-verifiable application called Aegis Bank while preserving its functionality. The problem is that lending users need credit without giving a company custody of their collateral. In Aegis Bank, ETH remains in a smart-contract vault, DBUSD debt is issued on-chain, and a user’s borrowing capacity and liquidation risk are derived from the oracle price and contract rules.
>
> The protocol has five contracts. CollateralVault holds ETH; Stablecoin handles DBUSD; InterestEngine calculates a utilization-based variable APR; PriceOracle supplies a freshness-checked ETH/USD value; and LendingPool coordinates the position lifecycle. The main parameters are 150% initial collateralization, an 85% liquidation threshold, a 7% liquidation bonus, and a rate curve from 2% to 18% APR.
>
> The frontend uses Next.js 16 App Router, React 19, JavaScript, vanilla Tailwind, and ethers 6. It keeps financial values as bigint, reads contract state without a wallet when possible, and uses MetaMask only for account authorization and signing. Before a user signs, the client validates input, previews impact, simulates the exact call, and estimates gas. It then shows signing, submitted, confirmed, rejected, or reverted states and refreshes only after a successful receipt.
>
> I verified all five contract sources on Sepolia, completed public deposit, borrow, partial repay, and safe withdrawal transactions, deployed the frontend to Vercel, and published a guarded `v1.0.0` GitHub release. The important limitation is that the oracle is manually owner-updated and the contracts are unaudited, so the project is intentionally Sepolia-only.

### Five-minute architecture version

Start with the user journey, then move down the stack:

1. A visitor can inspect public protocol data before connecting a wallet.
2. MetaMask exposes an EIP-1193 provider. The app requests permission only when the user selects Connect.
3. A read-only ethers provider resolves protocol state from the committed Sepolia addresses. Wallet identity and read infrastructure remain separate boundaries.
4. For a write, the app validates 18-decimal input, calculates a labeled estimate, simulates the exact contract call, estimates gas, and displays a review.
5. MetaMask signs and broadcasts. The UI exposes the transaction hash immediately but does not claim success until receipt status is `1`.
6. LendingPool enforces the final rule and delegates custody, mint/burn, rate, and price responsibilities to narrow modules.
7. Contract events and Etherscan are public evidence. There is no database that can disagree with the chain.

Finish by naming the boundary: the deployed frontend and release process are production-style; the financial protocol itself remains a testnet demonstration.

## Live demo script

### Preparation

- Open [the production application](https://decentralized-banking.vercel.app) and the [Sepolia explorer](https://sepolia.etherscan.io).
- Use a dedicated test-only MetaMask account with a small Sepolia ETH balance.
- Confirm the wallet network is Ethereum Sepolia and the oracle is fresh.
- Never expose a private key or seed phrase during screen sharing.

### Demonstration flow

1. **Landing and read layer:** Explain that protocol and connected-position values come from the deployed contracts. Show the block number or automatic refresh as evidence.
2. **Connect:** Select Connect and explain that `eth_requestAccounts` is called only after this user action. Show the shortened address and Sepolia network state.
3. **Deposit:** Enter a small ETH amount. Explain the projected collateral, credit, and health. Review the simulated action, confirm it in MetaMask, open the transaction hash, and show refreshed collateral.
4. **Borrow:** Enter a DBUSD amount below the displayed maximum. Explain the projected debt and health factor. Confirm and show both debt and DBUSD wallet balance increasing.
5. **Repay:** Repay part of the debt. Explain the direct LendingPool burn, then show debt decreasing and health improving.
6. **Withdraw:** Choose an amount that leaves the position safe. Explain that the UI preview helps the user, but `LendingPool.withdraw` performs the decisive capacity check.
7. **Liquidation:** Paste a healthy borrower address. Show “Healthy / ineligible” and the disabled action. Explain that automated tests create unhealthy positions and prove liquidation execution and boundaries without deliberately endangering the public demonstration account.
8. **Evidence:** End with the GitHub release, Etherscan-verified contracts, focused tests, gas report, and production `/health` commit.

### Demo fallback

If MetaMask, Sepolia, or the public RPC is unavailable:

- do not pretend a blank or cached value is live;
- show the plain-language RPC/wallet error and explain the availability boundary;
- use the committed [Sepolia smoke-test evidence](sepolia-smoke-test.md), explorer transactions, and automated browser journey;
- show `/health` to prove the deployed artifact and release commit;
- continue with code and test evidence, then retry the live action later.

## Protocol mathematics you should be able to explain

The implementation uses 18-decimal fixed-point arithmetic rather than floating point.

```text
collateral value = ETH collateral × normalized ETH/USD price
maximum debt     = collateral value / 1.50
borrowing power  = maximum debt - current debt, floored at zero
health factor    = collateral value × 0.85 / debt
utilization      = total debt / total collateral value, capped at 100%
simple interest  = debt × annual rate × elapsed seconds / 365 days
```

The variable APR is 2% at zero utilization, 10% at the 80% kink, and 18% at 100%. Below the kink it is `2% + utilization × 10%`. Above the kink it is `10% + (utilization - 80%) × 40%`.

An account can borrow up to two-thirds of its collateral value because required initial collateralization is 150%. It becomes eligible for liquidation only when `collateral value × 85% / debt < 1.00`. The liquidator repays eligible DBUSD debt and receives equivalent ETH collateral plus a 7% bonus, capped by the collateral actually available.

### Example

At a `$2,000` ETH price:

- `0.001 ETH` is worth `$2.00`;
- maximum debt is `$2.00 / 1.50 = 1.333... DBUSD`;
- borrowing `0.5 DBUSD` gives an initial health factor of `$2.00 × 0.85 / $0.50 = 3.4`.

This matches the confirmed Sepolia smoke test. Integer rounding means displayed values may be shortened, while the contract retains base-unit precision.

## Core technical questions

### Why split the protocol into five contracts?

**Short answer:** It isolates custody, token authority, rate math, price data, and lending coordination so each trust boundary is explicit and testable.

**Deep answer:** The vault can release ETH only through the permanently assigned pool; the stablecoin can mint or burn only through that pool; the rate engine is stateless; the oracle has a narrow price/freshness interface; and the pool owns position rules. Smaller responsibilities make access-control failures easier to detect and allow formula tests without deploying the whole UI.

**Follow-up:** Why not keep everything in one contract? A monolith would reduce deployment calls but enlarge the authority and audit surface, mix custody with policy, and make isolated reasoning harder.

### Why is the application non-custodial?

**Short answer:** Users sign their own transactions, and no backend holds their wallet credentials or keeps an authoritative balance database.

**Deep answer:** ETH is held by the contract vault, not an application company. MetaMask controls account authorization and transaction signatures. Contract state and events are the source of financial truth. “Non-custodial” does not mean “trustless in every dimension”: users still trust the contract code and, in this demonstration, the oracle owner.

### How do you prevent over-borrowing and unsafe withdrawals?

**Short answer:** Both UI previews and LendingPool checks compare resulting debt with the maximum debt derived from collateral value and the 150% ratio.

**Deep answer:** `borrow` accrues interest first, adds the requested amount, and reverts when resulting debt exceeds maximum debt. `withdraw` accrues interest, calculates remaining collateral, and reverts if existing debt would exceed the new maximum. Contract checks protect the system even if someone bypasses the frontend.

### How does liquidation work?

**Short answer:** A third party can burn DBUSD to repay an account only when its health factor is below one, receiving the equivalent ETH plus a 7% bonus.

**Deep answer:** The pool accrues the borrower’s interest, takes one normalized oracle snapshot, rejects healthy accounts, calculates debt limited by the 100% close factor and available collateral, rounds base ETH seizure upward, caps seizure at available collateral, burns the liquidator’s DBUSD, and transfers the collateral. Checks and state changes happen before the external value transfer.

### Why is the close factor 100%?

It preserves the source project’s one-click liquidation behavior. It simplifies the demo but can create large liquidations and concentrated execution risk. A real market should choose close factor from liquidity, volatility, slippage, and bad-debt simulations rather than tutorial parity.

### How does interest accrue?

Interest is simple, per-second, and lazy. Reads preview elapsed interest, while debt-sensitive writes materialize it into the account and `totalBorrowed`. This bounds routine computation and avoids iterating over users. The trade-off is that aggregate stored debt can temporarily exclude unmaterialized interest for inactive accounts.

### Why use `bigint` and `Math.mulDiv`?

JavaScript numbers cannot represent 18-decimal token amounts safely, and Solidity division rounds integers. The frontend therefore preserves `bigint` until formatting, while contracts use fixed-point integers and `Math.mulDiv` for explicit scaling. Liquidation’s USD-to-ETH conversion deliberately rounds upward before applying the bonus, then caps the result.

### Why is there no DBUSD approval transaction?

The Stablecoin permanently authorizes only LendingPool to mint or burn. Repay and liquidation call the pool, which burns DBUSD from the caller directly. This removes one transaction and matches the source behavior. It is less conventional than `transferFrom` plus allowance, so it is documented and tested rather than hidden.

### Why use `staticCall` before signing?

It executes the exact call against current chain state without changing state and catches many deterministic reverts before showing a wallet prompt. It cannot guarantee success: oracle price, interest, balances, nonce, ordering, and fees may change before mining. The receipt is still the source of confirmation truth.

### What happens if the account or network changes during review?

The transaction provider keys prepared state by account and chain. A change resets the prepared execution, and signer identity is checked again before submission. The user must review the transaction again.

## Frontend questions

### Why Next.js App Router?

It provides file-based routing, layouts, a production build pipeline, and clean server/client boundaries. Public education can render without wallet access, while explicit client components own browser-only wallet and transaction behavior.

### Why JavaScript instead of TypeScript?

JavaScript was a project requirement. The cost is less compile-time ABI and unit safety. The project compensates with small modules, runtime address and chain validation, generated ABI/address artifacts, linting, and focused tests around conversions and transaction state.

### Why vanilla Tailwind instead of a UI kit?

It allowed an original, lightweight visual system rather than reproducing the tutorial or inheriting a component framework. The trade-off is owning keyboard, focus, responsive, contrast, status, and form behavior, which is why those concerns have dedicated components and automated checks.

### Why not put all Web3 logic in page components?

Wallet state lives in a framework-independent store and provider, reads live in a protocol reader/hook, transaction preparation lives in a client module, and lifecycle state lives in a shared reducer/provider. Pages compose those boundaries. This avoids duplicated provider calls and inconsistent feedback across actions.

### Why use a separate read provider and wallet provider?

The public RPC provides consistent protocol reads even before connection. The injected wallet provides identity, network requests, and signatures. Separating them prevents wallet configuration from silently becoming the application’s only data source and makes each failure state clearer.

## Network, deployment, and provider questions

### Why Ethereum Sepolia and Sepolia ETH?

Sepolia tests real public Ethereum behavior—wallet prompts, gas estimation, confirmations, explorer indexing, source verification, and RPC variability—without risking real funds. Sepolia ETH is a valueless test asset used for deployment and transaction gas and as demonstration collateral. It has no real-world value and should never be bought or treated as an investment.

### Why was Alchemy considered?

Alchemy offered a straightforward Ethereum Sepolia HTTPS endpoint plus per-application metrics, quotas, request logs, and a path to support, so it was useful during provider and deployment setup. An RPC endpoint is the full `https://.../v2/<key>` URL; the API key alone is not an RPC URL.

For the shipped browser build, PublicNode was selected because a browser RPC variable is public and a keyless endpoint avoids exposing or rotating a project-specific key. The downside is shared capacity and no project-specific service commitment. For a higher-reliability release, use a dedicated provider such as Alchemy as primary, add a second-provider fallback, and monitor errors, latency, and quota.

### Does the RPC provider control the contracts?

No. The provider relays JSON-RPC reads and broadcasts signed transactions. Contract bytecode and state live on Sepolia. A provider outage can make the UI unavailable or stale, but it cannot sign for the user or rewrite finalized chain state.

### How did you verify deployment integrity?

The deployment script writes one chain manifest and exports matching ABIs/addresses to the frontend. A read-only verifier checks chain ID, bytecode at every address, immutable module topology, vault/token pool authorities, and oracle ownership. All five sources are verified on Etherscan.

### How does the release guard work?

The manually dispatched production workflow runs only from `main`, validates semantic tag format, rejects stale/local/duplicate manifests and unsafe URLs, verifies Sepolia contracts, runs `pnpm check`, checks the live `/health` commit and every route, and creates the GitHub release only after all gates pass. `v1.0.0` points to commit `20f78395fb22e1cd51499b4ea48374cb5eb7988b`.

## Security and senior-level follow-ups

### Is the protocol secure?

The accurate answer is: it has meaningful security controls and evidence, but it is unaudited and not safe for real value. Reentrancy protection, access controls, stale-price rejection, invariant/fuzz tests, adversarial receiver tests, Slither, gas ceilings, and guarded deployment reduce risk. They do not replace an independent audit, economic validation, decentralized oracle, multisig/timelock, monitoring, or incident response.

### What is the largest trust assumption?

The owner-updated price oracle. Its owner can move every account’s borrowing capacity and health factor. Freshness prevents old data but does not prove correctness. A real version needs decentralized feeds, sanity/deviation checks, fallback behavior, and clear failure-mode analysis.

### Does DBUSD really maintain a one-dollar peg?

Not by itself. It is denominated in 18-decimal dollar units for debt accounting, but this project does not implement redemption reserves, a market, arbitrage, or monetary policy that guarantees a market peg. Calling it a protocol-issued debt token is more precise than claiming a proven stable asset.

### Why no upgradeable proxy?

Immutability reduces proxy/admin complexity and makes the deployed code easier to verify for a portfolio release. It also removes in-place fixes. A failed deployment must be replaced and the manifest updated. A real protocol would evaluate immutable versioned markets against carefully governed upgrades, not add a proxy automatically.

### Why no pause mechanism?

The project did not add an emergency role without a complete governance and response model. That avoids an unexplained centralized switch but leaves no rapid containment mechanism. Before real value, pause scope, authority, multisig, timelock exceptions, monitoring triggers, and recovery must be designed together.

### Could a reentrant ETH recipient steal funds?

Value-moving entry points are guarded, vault balances are reduced before the low-level transfer, and transfer failure reverts the whole operation. A malicious receiver contract is included in tests. This specifically reduces reentrancy risk; it is not a claim that every possible protocol attack is eliminated.

### What happens during an oracle or RPC outage?

A stale on-chain oracle reverts price-dependent reads and writes, failing closed. A browser RPC outage prevents the frontend from reading or broadcasting but does not change chain state. The UI explains the failure and retries after connectivity recovers. A production service needs monitored primary/fallback providers and an owned oracle update process.

### What would you change first for mainnet?

I would not start with more UI features. I would first define the economic model, replace the manual oracle, add governance and emergency controls, commission independent audits, model liquidation and bad debt under stress, add monitoring/failover, and run a staged-value testnet and mainnet rollout under a separate threat model.

## Testing and gas questions

### What does the test strategy prove?

- Contract unit and boundary tests prove individual public behaviors and reverts.
- Fuzz tests cover interest math across randomized inputs.
- Stateful invariant tests execute randomized multi-account actions and check collateral/debt reconciliation and safety properties.
- Adversarial receiver tests exercise failed and reentrant ETH-receipt behavior.
- Frontend unit tests cover formatting, validation, chain, read-client, transaction-client, reducer, and wallet-store behavior.
- Playwright exercises the actual injected-wallet/RPC/contract boundary and all public routes.
- Axe and narrow-screen checks catch automated accessibility and overflow regressions.
- Release tests fail closed on stale manifests, wrong commits, insecure URLs, and missing evidence.

Tests prove the asserted scenarios under their environments. They do not prove the absence of unknown vulnerabilities or validate the market economics.

### How did you approach gas optimization?

Correctness and invariants came first. The measured optimization cached oracle decimals and reused one price snapshot during liquidation, cutting its deterministic baseline from 108,978 to 103,872 gas, or 4.69%. The project avoided opaque packing or arithmetic changes without a meaningful measured benefit. CI-style ceilings detect regressions, but actual network fees still depend on state, calldata, and fee markets.

## Challenges and lessons learned

### RPC configuration looked valid but failed

The lesson was to separate an API key from a full endpoint, trim clipboard input, validate URI shape, and test `eth_chainId` before deployment. The final browser configuration uses a keyless public endpoint; secrets never belong in source files.

### MetaMask connected the wrong account

Disconnecting the app locally does not revoke a site’s wallet permissions. The correct solution was to manage the dApp connection in MetaMask, select Account 4, and reauthorize. The code also invalidates reviewed transactions when the active account changes.

### The dashboard displayed small collateral as zero

The contracts held the correct base-unit value, but presentation rounded `0.0005 ETH` too aggressively. A precision fix adjusted formatting and added regression evidence. This showed that Web3 correctness includes display precision: a technically correct read can still mislead a user if formatted poorly.

### The testnet oracle became stale

The oracle correctly failed closed after its 24-hour window. Refreshing it through the verified Etherscan contract restored reads. The lesson is that an oracle is an operated dependency, not just a contract interface.

### Automatic Vercel Git linking did not work for the nested frontend

The release used the pinned Vercel CLI with the full merged commit injected as build metadata, then verified that exact SHA through `/health`. This kept the release traceable, while automatic previews and `main` deployment remain an acknowledged delivery improvement.

## Evidence to know

### Public links

- Application: [decentralized-banking.vercel.app](https://decentralized-banking.vercel.app)
- Repository: [ChristianUgo/Decentralized-Banking](https://github.com/ChristianUgo/Decentralized-Banking)
- Release: [v1.0.0](https://github.com/ChristianUgo/Decentralized-Banking/releases/tag/v1.0.0)
- Release workflow: [GitHub Actions run 32754206681](https://github.com/ChristianUgo/Decentralized-Banking/actions/runs/32754206681)
- LendingPool: [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x2E1cef27de10A2e93567491266651c0c17ABB1b0)
- Deployment and smoke-test details: [production evidence](production-deployment-evidence.md) and [Sepolia evidence](sepolia-smoke-test.md)

### Contract addresses

| Contract | Sepolia address |
| --- | --- |
| CollateralVault | `0x9b3Dc96C052fc175e0Fa0A50F8d1D3323B409430` |
| InterestEngine | `0x4D1b4eDD73427f202C88E7d8f3f23FeF6efa3eA4` |
| LendingPool | `0x2E1cef27de10A2e93567491266651c0c17ABB1b0` |
| PriceOracle | `0x4564E03618ed5d80b8eC4c4b66B078470668b493` |
| Stablecoin | `0x0b479966EbB345a507d9c3Eb16555E92Cb5ab787` |

### Public transaction evidence

| Action | Transaction |
| --- | --- |
| Oracle refresh | [`0x10ead9…0bd63`](https://sepolia.etherscan.io/tx/0x10ead95a50663bae5dc1bbe106156db7f34afe58909aa7278e0943dbbbe0bd63) |
| Deposit | [`0x20ebc7…57a78e`](https://sepolia.etherscan.io/tx/0x20ebc72e1c075f6ac92e71e261f34e69dbdb27b0d4ac51d3e22ead55cd57a78e) |
| Borrow | [`0x8afff9…a9fbb5`](https://sepolia.etherscan.io/tx/0x8afff97dab8d604eb00f4cd8e198aee7c3453edbf284ac452aee58891ca9fbb5) |
| Repay | [`0xb6551a…8af1e2`](https://sepolia.etherscan.io/tx/0xb6551aef1277de8c316e9dccf5e27107003ce636d0d0339916790cbdaf8af1e2) |
| Withdraw | [`0x976566…1c0bd`](https://sepolia.etherscan.io/tx/0x976566af71714bcca628f9a7153a51303752303ca073f15b8b0eec003617c0bd) |

## Claims to avoid

Do not say:

- “The contracts are audited,” “production safe,” or “mainnet ready.”
- “DBUSD is guaranteed to stay at one dollar.”
- “The oracle is decentralized.”
- “Simulation guarantees the transaction will succeed.”
- “The frontend prevents malicious calls.” Contract checks provide the real enforcement.
- “A green static analyzer proves security.”
- “Sepolia ETH has real value.”
- “The app disconnect button revokes MetaMask permission.” It clears local application state.
- “Every liquidation path was manually executed on Sepolia.” The healthy guard was manually demonstrated; execution is automated in tests.
- “Alchemy is hidden in the shipped frontend.” The release uses keyless PublicNode; Alchemy was evaluated as a dedicated provider option.

## Resume and portfolio wording

### One-line portfolio description

Built and released a non-custodial Ethereum Sepolia lending dApp with modular Solidity contracts, risk-aware Next.js transaction UX, invariant/browser testing, verified deployments, CI security gates, and a commit-addressed `v1.0.0` release.

### Resume bullets

- Engineered a five-contract overcollateralized lending protocol supporting ETH deposits, DBUSD borrowing/repayment, safe withdrawals, utilization-based interest, and incentivized liquidation.
- Built an original responsive Next.js 16 and Tailwind 4 interface with injected-wallet lifecycle management, bigint financial math, preflight simulation, gas estimates, receipt-based confirmation, and accessible risk previews.
- Established 31 contract tests, fuzz/stateful invariants, 33 frontend tests, Playwright banking and WCAG checks, Slither/Solhint gates, and deterministic gas regression ceilings.
- Deployed and verified five contracts on Ethereum Sepolia, recorded public transaction evidence, deployed the frontend to Vercel, and published a guarded semantic GitHub release tied to the live commit.

## Final study checklist

Before an interview, be able to do each of these without reading:

- explain the project in 30 seconds and two minutes;
- draw the five-contract architecture and identify every authority;
- calculate maximum debt and health factor from a simple example;
- explain the kinked rate curve and lazy interest trade-off;
- walk through transaction simulation, signing, receipt, and refresh;
- explain why UI validation is not a security boundary;
- state the oracle, RPC, audit, peg, upgradeability, governance, and monitoring limitations;
- explain Sepolia ETH, Alchemy versus PublicNode, and why RPC choice does not change deployed state;
- cite one security test, one gas result, one public transaction, and the release commit;
- describe what must change before any real-value deployment.

End with the honest summary: **Aegis Bank demonstrates how to design, test, explain, deploy, and release a lending protocol; it does not claim that a portfolio demonstration is a production bank.**
