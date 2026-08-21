# ADR 0009: Production frontend release and hosting

- Status: Accepted
- Date: 2026-08-21

## Context

Stage 7 established deterministic local browser QA and a guarded Sepolia deployment path. A public frontend release still needs a reproducible hosting boundary, proof that the deployed artifact matches the intended commit and chain manifest, safe rollback, and a GitHub release that cannot be published before the live application passes independent checks.

## Decision

The Next.js application is deployed through Vercel's Git integration with `frontend/` configured as the project Root Directory. Preview deployments are created for pull requests and `main` is the production branch. Vercel configuration lives with the frontend and adds baseline transport, framing, content-type, referrer, and browser-permission headers.

Production builds require a committed Sepolia manifest, a byte-for-byte matching frontend address export, five unique contract addresses, seven transaction hashes, and HTTPS-only public configuration. A static `/health` route exposes only the release commit, chain identifier, network name, and service status. It exposes no provider URL, key, account, or contract authority.

GitHub Releases remain manual. A release owner dispatches the production workflow from `main` with a semantic tag and verified deployment URL. The workflow reruns repository gates, validates release inputs, checks the deployed `/health` commit, scans every route for browser and accessibility failures, and creates the release only after all evidence passes.

## Consequences

- A successful merge can deploy the frontend, but it cannot silently publish a GitHub release.
- The live application is rejected if it points at localhost, a non-Sepolia manifest, stale exported addresses, insecure URLs, or a different commit.
- Vercel project linking and environment values remain external configuration and must be reviewed in the dashboard.
- Rollback promotes a previously verified Vercel deployment; published releases remain historical evidence and are followed by a corrective patch release rather than rewritten.
- Production hosting still means a public testnet demonstration. It does not make the contracts audited, decentralized at the oracle layer, or safe for real value.
