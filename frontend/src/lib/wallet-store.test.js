import { describe, expect, it } from "vitest";

import { createWalletStore } from "./wallet-store";

const ACCOUNT = "0x1234567890abcdef1234567890abcdef12345678";
const CHAIN = {
  hexId: "0x7a69",
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrl: "http://127.0.0.1:8545",
};

class FakeProvider {
  constructor({ accounts = [], chainId = "0x7a69" } = {}) {
    this.accounts = accounts;
    this.chainId = chainId;
    this.listeners = new Map();
    this.requests = [];
    this.rejectConnection = false;
    this.requiresChainAddition = false;
  }

  on(event, listener) {
    this.listeners.set(event, listener);
  }

  emit(event, value) {
    this.listeners.get(event)?.(value);
  }

  async request({ method, params }) {
    this.requests.push(method);
    if (method === "eth_accounts") return this.accounts;
    if (method === "eth_chainId") return this.chainId;
    if (method === "eth_requestAccounts") {
      if (this.rejectConnection) throw Object.assign(new Error("Rejected"), { code: 4001 });
      return this.accounts;
    }
    if (method === "wallet_switchEthereumChain") {
      if (this.requiresChainAddition) {
        this.requiresChainAddition = false;
        throw Object.assign(new Error("Unknown chain"), { code: 4902 });
      }
      this.chainId = params[0].chainId;
      return null;
    }
    if (method === "wallet_addEthereumChain") {
      this.chainId = params[0].chainId;
      return null;
    }
    throw new Error(`Unexpected request: ${method}`);
  }
}

describe("wallet store", () => {
  it("reports when an injected wallet is unavailable", async () => {
    const store = createWalletStore({ chain: CHAIN, getProvider: () => null });
    await store.initialize();
    expect(store.getSnapshot().status).toBe("unavailable");
  });

  it("restores an authorized account without prompting", async () => {
    const provider = new FakeProvider({ accounts: [ACCOUNT] });
    const store = createWalletStore({ chain: CHAIN, getProvider: () => provider });
    await store.initialize();
    expect(store.getSnapshot()).toMatchObject({
      account: ACCOUNT,
      chainId: 31337,
      status: "connected",
    });
    expect(provider.requests).not.toContain("eth_requestAccounts");
  });

  it("surfaces rejected connection requests", async () => {
    const provider = new FakeProvider({ accounts: [ACCOUNT] });
    provider.rejectConnection = true;
    const store = createWalletStore({ chain: CHAIN, getProvider: () => provider });
    await store.initialize();
    await store.connect();
    expect(store.getSnapshot()).toMatchObject({
      error: "The wallet request was rejected.",
      status: "error",
    });
  });

  it("adds an unknown target chain and reacts to account changes", async () => {
    const provider = new FakeProvider({ accounts: [ACCOUNT], chainId: "0x1" });
    provider.requiresChainAddition = true;
    const store = createWalletStore({ chain: CHAIN, getProvider: () => provider });
    await store.initialize();
    expect(store.getSnapshot().status).toBe("unsupported");

    await store.switchNetwork();
    expect(store.getSnapshot().status).toBe("connected");
    expect(provider.requests).toContain("wallet_addEthereumChain");

    provider.emit("accountsChanged", []);
    expect(store.getSnapshot().status).toBe("disconnected");
  });
});
