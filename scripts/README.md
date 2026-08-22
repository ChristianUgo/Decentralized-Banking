# Protocol scripts

- `deploy.js` deploys the local Stage 2 protocol, assigns the LendingPool once as vault controller and DBUSD minter/burner, and writes a chain-address manifest.
- `export-frontend-artifacts.js` copies the five public contract ABIs and the selected address manifest into `frontend/src/contracts/`.
- `lib/deploy-protocol.js` is the shared deterministic deployment primitive used by scripts and tests.
- `report-gas.js` executes the reviewed banking scenario and fails if any transaction exceeds its Stage 3 gas ceiling.
- `verify-contract-sources.js` publishes the five deployed module sources to Etherscan using constructor arguments derived from the committed Sepolia manifest.

Run `pnpm deploy:local` after compilation. The default Hardhat network is ephemeral; the exported local addresses are development fixtures, not production deployment evidence.
