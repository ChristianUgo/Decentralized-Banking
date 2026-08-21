# Production frontend and GitHub release runbook

This runbook publishes the Aegis Bank interface as a public Ethereum Sepolia demonstration. “Production” describes the hosted frontend environment, not approval for mainnet or real funds.

## 1. Required release state

Before configuring hosting:

- Merge a verified Sepolia deployment manifest at `deployments/11155111.json`.
- Confirm `frontend/src/contracts/addresses.json` is the generated copy of that manifest.
- Run `pnpm verify:sepolia` with the release-owner RPC endpoint.
- Confirm `pnpm check` and `pnpm test:e2e` pass on the exact commit.
- Use a browser-safe Sepolia RPC endpoint. Anything prefixed with `NEXT_PUBLIC_` is public.

Stage 8 must not deploy the current local-chain manifest. `pnpm release:validate` deliberately fails until the Sepolia evidence and production public variables exist.

## 2. Create the Vercel project

Use Vercel's Git integration:

1. Import `ChristianUgo/Decentralized-Banking` into the correct Vercel account or team.
2. Set **Root Directory** to `frontend`.
3. Keep the detected framework as **Next.js** and the production branch as `main`.
4. Keep source files outside the Root Directory available so Vercel can use the repository-level pnpm lockfile and workspace metadata.
5. Do not override the output directory; use the Next.js default.
6. Enable deployment protection for previews and leave production publicly readable.

The committed `frontend/vercel.json` supplies the framework declaration and baseline response headers. The `.vercel/` link is local account metadata and must not be committed.

## 3. Configure public environment values

Set these values for Production in Vercel:

```text
NEXT_PUBLIC_RPC_URL=<browser-safe HTTPS Sepolia RPC URL>
NEXT_PUBLIC_EXPLORER_URL=https://sepolia.etherscan.io
NEXT_PUBLIC_SITE_URL=https://<production-domain>
```

Preview may use a separate browser-safe Sepolia RPC quota. Omit `NEXT_PUBLIC_SITE_URL` in previews unless a stable preview alias exists; non-production builds are marked `noindex`.

Add the browser-safe RPC URL to the GitHub repository as the Actions secret `SEPOLIA_PUBLIC_RPC_URL`. Despite the secret storage, the value is embedded into the client bundle and must be treated as public and quota-limited.

Never add `SEPOLIA_PRIVATE_KEY`, seed phrases, personal RPC credentials, or a mainnet endpoint to Vercel.

## 4. Validate preview and production

Review the Vercel preview attached to the Stage 8 pull request. After merge, wait for the `main` production deployment to report Ready, then run:

```powershell
$env:NEXT_PUBLIC_RPC_URL = "https://browser-safe-sepolia-rpc"
$env:NEXT_PUBLIC_EXPLORER_URL = "https://sepolia.etherscan.io"
$env:NEXT_PUBLIC_SITE_URL = "https://production-domain"
pnpm release:validate

$env:PRODUCTION_URL = "https://production-domain"
$env:EXPECTED_COMMIT_SHA = "<full-main-commit-sha>"
pnpm test:production
```

The production suite verifies `/health`, the full commit SHA, all public routes, HTTP failures, browser console errors, Next.js overlays, meaningful content, and automated WCAG A/AA rules.

## 5. Publish the GitHub release

In GitHub Actions, open **Production release**, choose **Run workflow** on `main`, and provide:

- `release_tag`: a new `vMAJOR.MINOR.PATCH` value, such as `v1.0.0`;
- `production_url`: the verified HTTPS production URL.

The workflow refuses non-semantic tags, existing releases, non-main refs, invalid manifests, mismatched live commits, or failed quality checks. Enable GitHub's immutable releases setting before the first public release when it is available for the repository.

## 6. Post-release evidence

Record these links in the project handoff:

- GitHub release and tag
- production and preview deployments
- production commit SHA and `/health` response
- Sepolia deployment manifest and explorer transactions
- successful Production release workflow
- known limitations and security assumptions

Check Vercel runtime/build logs for errors and confirm the project has an owner responsible for RPC quota alerts and availability. The application has a health contract but no third-party error drain in Stage 8; that is an explicit monitoring gap.

## 7. Rollback and recovery

If production is unhealthy, immediately promote the last verified Vercel deployment from the Deployments dashboard and rerun `pnpm test:production` against the restored URL. Do not disable deployment protection or change contract addresses manually.

If a GitHub release was already published, preserve it as historical evidence. Fix the problem through a reviewed patch, deploy and verify a new artifact, then publish a higher patch version. If a deployment key or RPC credential is exposed, rotate it before any redeployment.
