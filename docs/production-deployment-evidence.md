# Production deployment evidence

This record captures the verified Aegis Bank frontend deployed on 2026-08-24. “Production” refers to the public hosted interface. The contracts are an unaudited Ethereum Sepolia demonstration and must not be used with real funds or on mainnet.

## Release identity

| Field | Evidence |
| --- | --- |
| Canonical URL | [decentralized-banking.vercel.app](https://decentralized-banking.vercel.app) |
| Immutable deployment URL | [decentralized-banking-2pupfwc9u-christian-ugo-projects.vercel.app](https://decentralized-banking-2pupfwc9u-christian-ugo-projects.vercel.app) |
| Vercel deployment | `dpl_5Z2ocoFHz2nnJGht4vvuVGiah67A` |
| Vercel inspector | [Deployment 5Z2ocoFHz2nnJGht4vvuVGiah67A](https://vercel.com/christian-ugo-projects/decentralized-banking/5Z2ocoFHz2nnJGht4vvuVGiah67A) |
| Git commit | [`62ed13bc9a19e3819936d72ebebdf7b3576c0042`](https://github.com/ChristianUgo/Decentralized-Banking/commit/62ed13bc9a19e3819936d72ebebdf7b3576c0042) |
| Precision-fix pull request | [PR #18](https://github.com/ChristianUgo/Decentralized-Banking/pull/18) |
| Target and status | Production / Ready |
| Framework | Next.js 16.3.1 with Turbopack |
| Build region and duration | Washington, D.C. (`iad1`) / 10 seconds |

The production build received the full merged commit SHA through `VERCEL_GIT_COMMIT_SHA`. This makes the static health response commit-addressable even though the deployment was initiated through the pinned Vercel CLI rather than an automatic Git deployment.

## Public configuration

| Variable | Production value |
| --- | --- |
| `NEXT_PUBLIC_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` |
| `NEXT_PUBLIC_EXPLORER_URL` | `https://sepolia.etherscan.io` |
| `NEXT_PUBLIC_SITE_URL` | `https://decentralized-banking.vercel.app` |

These values are intentionally public browser configuration. No deployer private key, seed phrase, Etherscan API key or credential-bearing RPC URL is stored in the frontend or Vercel environment.

PublicNode was selected for the shipped browser read layer because it is keyless and avoids exposing or rotating a client-side provider key. The trade-off is reliance on a shared third-party endpoint with no project-specific availability or rate-limit guarantee. Alchemy was evaluated and remains a reasonable dedicated-provider alternative if authenticated quotas, request analytics or support become necessary.

## Health contract

The live [`/health`](https://decentralized-banking.vercel.app/health) response was checked after alias promotion:

```json
{"chainId":11155111,"network":"sepolia","release":"62ed13bc9a19e3819936d72ebebdf7b3576c0042","status":"ok"}
```

The response confirms the intended chain and exact release without exposing the RPC URL, wallet address, contract authorities or secrets.

## Quality and browser verification

The merged change passed GitHub's integrated quality, Slither static-analysis, and banking journey/accessibility jobs. Before deployment, the complete local gate passed:

- 31 Solidity contract tests;
- 3 production-release validation tests;
- 33 frontend unit tests;
- Next.js production build and Solidity compile;
- deterministic gas ceilings for all six measured protocol actions;
- dependency audit with no high-severity vulnerability.

After deployment, agent-browser 0.34.0 checked the canonical production domain and every public banking route:

| Route | Meaningful content | Next.js overlay | Page error | RPC/read error | Axe WCAG A/AA violation |
| --- | --- | --- | --- | --- | --- |
| `/` | Pass | None | None | None | 0 |
| `/dashboard` | Pass | None | None | None | 0 |
| `/deposit` | Pass | None | None | None | 0 |
| `/borrow` | Pass | None | None | None | 0 |
| `/repay` | Pass | None | None | None | 0 |
| `/liquidity` | Pass | None | None | None | 0 |

Axe marked one color-contrast check per route as incomplete because it could not determine backgrounds that use gradients; this is not a reported violation and remains a manual-review item. A full-page visual review found no blank state, clipping, broken layout or error overlay.

The release specifically verifies that the protocol collateral card renders `0.0005 ETH`. It does not regress to the previous misleading `0 ETH` value caused by three-decimal formatting.

## Observability and rollback

The post-deploy Vercel error-level log scan for the preceding hour returned no entries. The application is predominantly static and currently has no third-party error drain or RPC availability alert. This is an explicit monitoring gap, not evidence of guaranteed uptime.

Rollback uses Vercel's deployment history: promote the last verified production deployment, then repeat the health, route, console and accessibility checks before declaring recovery.

## Remaining release work

- Connect the Vercel project to GitHub for automatic commit-addressable previews and `main` deployments, or formalize a token-based CI deployment workflow.
- Run the guarded Production release workflow from `main` and publish the first semantic GitHub release.
- Preserve this evidence in the final project handoff and interview guide.

