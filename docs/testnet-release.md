# Sepolia testnet release runbook

This runbook prepares a public testnet demonstration. It does not approve the protocol for mainnet or real funds.

## Release owner prerequisites

- Use a new deployment account that is not used for personal assets.
- Fund it only with enough Sepolia ETH for the five deployments and two wiring transactions.
- Obtain a Sepolia RPC endpoint and keep credential-bearing URLs out of committed files.
- Confirm the working tree is clean and the intended commit has passed GitHub Actions.

Set secrets only in the current shell or an ignored local environment file:

```powershell
$env:SEPOLIA_RPC_URL = "https://your-sepolia-endpoint"
$env:SEPOLIA_PRIVATE_KEY = "0x..."
```

## Preflight and deployment

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test:e2e
pnpm deploy:sepolia
pnpm verify:sepolia
```

`pnpm deploy:sepolia` writes `deployments/11155111.json`, including deployment and authority-wiring transaction hashes, and exports the same manifest and ABIs to `frontend/src/contracts/`. Review those diffs before committing the deployment evidence. The verifier is read-only and fails if the RPC chain, bytecode, module wiring, LendingPool authority, or oracle owner differs from the manifest.

After the deployment evidence is committed, configure an Etherscan API V2 key and publish all five contract sources. This step does not require the deployment private key:

```powershell
$env:ETHERSCAN_API_KEY = "your-etherscan-api-key"
pnpm verify:sources:sepolia
Remove-Item Env:ETHERSCAN_API_KEY
```

## Frontend release configuration

Configure the deployment platform with public values only:

```text
NEXT_PUBLIC_RPC_URL=<browser-safe Sepolia RPC URL>
NEXT_PUBLIC_EXPLORER_URL=https://sepolia.etherscan.io
```

Never expose `SEPOLIA_PRIVATE_KEY` to Next.js or prefix it with `NEXT_PUBLIC_`.

## Evidence checklist

- [ ] Commit SHA and passing CI URL
- [x] Sepolia chain ID `11155111`
- [x] Dedicated deployer/oracle-owner address in [`deployments/11155111.json`](../deployments/11155111.json)
- [x] Five contract addresses from the generated manifest
- [x] Explorer transaction hashes for deployment and authority wiring in the manifest
- [x] Successful `pnpm verify:sepolia` verification
- [x] Five publicly verified contract-source pages on Sepolia Etherscan
- [x] Successful wallet connection and supported-network switch
- [x] Deposit, borrow, repay, and withdraw transaction links in [`sepolia-smoke-test.md`](sepolia-smoke-test.md)
- [x] Healthy-position liquidation guard evidence in [`sepolia-smoke-test.md`](sepolia-smoke-test.md)
- [ ] Full Sepolia liquidation transaction; automated contract tests currently provide execution coverage
- [ ] Desktop and mobile screenshots with no console errors
- [ ] Known limitations copied into the release notes

## Stop and recovery conditions

Stop if CI is red, the RPC reports another chain, the deployment account contains real assets, the oracle owner is unexpected, any verifier assertion fails, or generated artifacts contain unknown changes. Do not retry blindly after a partial deployment.

The protocol has no proxy or upgrade path. If deployment or wiring is incomplete, preserve transaction links for diagnosis, mark those addresses abandoned, rotate the dedicated key if exposure is suspected, and deploy a fresh set of modules. Never overwrite evidence for an earlier public deployment.

After verification, remove the private key from the shell:

```powershell
Remove-Item Env:SEPOLIA_PRIVATE_KEY
```
