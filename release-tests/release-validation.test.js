import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  REQUIRED_CONTRACTS,
  REQUIRED_TRANSACTIONS,
  validateProductionRelease,
} from "../scripts/lib/release-validation.js";

function fixture() {
  const contracts = Object.fromEntries(
    REQUIRED_CONTRACTS.map((name, index) => [name, `0x${String(index + 1).padStart(40, "0")}`]),
  );
  const transactions = Object.fromEntries(
    REQUIRED_TRANSACTIONS.map((name, index) => [name, `0x${String(index + 1).padStart(64, "0")}`]),
  );
  const deployment = {
    chainId: 11155111,
    network: "sepolia",
    deployer: "0x0000000000000000000000000000000000000099",
    contracts,
    transactions,
  };
  return {
    deployment,
    environment: {
      NEXT_PUBLIC_EXPLORER_URL: "https://sepolia.etherscan.io",
      NEXT_PUBLIC_RPC_URL: "https://sepolia.example-rpc.com/rpc",
      NEXT_PUBLIC_SITE_URL: "https://aegis-bank.example.com",
    },
    exportedDeployment: structuredClone(deployment),
  };
}

describe("production release validation", () => {
  it("accepts a synchronized Sepolia manifest and public HTTPS configuration", () => {
    assert.deepEqual(validateProductionRelease(fixture()), {
      chainId: 11155111,
      contractCount: 5,
      siteOrigin: "https://aegis-bank.example.com",
    });
  });

  it("rejects local-chain and stale frontend manifests", () => {
    const local = fixture();
    local.deployment.chainId = 31337;
    assert.throws(() => validateProductionRelease(local), /must target Ethereum Sepolia/);

    const stale = fixture();
    stale.exportedDeployment.contracts.LendingPool = "0x0000000000000000000000000000000000000088";
    assert.throws(() => validateProductionRelease(stale), /does not match/);
  });

  it("rejects insecure, local, and credential-bearing public URLs", () => {
    for (const rpcUrl of [
      "http://sepolia.example.com",
      "https://127.0.0.1:8545",
      "https://user:secret@sepolia.example.com",
    ]) {
      const release = fixture();
      release.environment.NEXT_PUBLIC_RPC_URL = rpcUrl;
      assert.throws(() => validateProductionRelease(release));
    }
  });
});
