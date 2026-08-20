# Generated contract data

`pnpm deploy:local` regenerates `abis.json` and `addresses.json` from compiled contracts and the local chain manifest. The committed chain `31337` data is a deterministic development fixture, not proof of a persistent deployment.

Do not edit generated ABI or address files manually. Testnet and production exports must come from reviewed, verified deployment manifests.

Stage 4 reads the committed chain ID and addresses at build time. `NEXT_PUBLIC_RPC_URL` selects the matching public JSON-RPC endpoint and defaults to `http://127.0.0.1:8545`; because the variable is shipped to browsers, it must not contain a confidential credential.
