# Protocol scripts

- `deploy.js` deploys the local Stage 2 protocol, assigns the LendingPool once as vault controller and DBUSD minter/burner, and writes a chain-address manifest.
- `export-frontend-artifacts.js` copies the five public contract ABIs and the selected address manifest into `frontend/src/contracts/`.

Run `pnpm deploy:local` after compilation. The default Hardhat network is ephemeral; the exported local addresses are development fixtures, not production deployment evidence.
