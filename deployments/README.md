# Deployment manifests

`scripts/deploy.js` writes one JSON manifest per chain ID. The committed `31337.json` file is a deterministic local-development fixture only. The reviewed `11155111.json` manifest records the verified Sepolia deployment; its five addresses have exact-match Solidity source published on Etherscan. Testnet and production manifests must be created from verified deployments and reviewed before release.
