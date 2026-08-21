const RPC_URL = "http://127.0.0.1:8545";

export async function installInjectedWallet(page) {
  await page.addInitScript(({ rpcUrl }) => {
    let requestId = 0;
    const listeners = new Map();

    const rpcRequest = async (method, params = []) => {
      const response = await fetch(rpcUrl, {
        body: JSON.stringify({ id: ++requestId, jsonrpc: "2.0", method, params }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();
      if (payload.error) {
        const error = new Error(payload.error.message);
        error.code = payload.error.code;
        error.data = payload.error.data;
        throw error;
      }
      return payload.result;
    };

    const provider = {
      isMetaMask: true,
      on(eventName, listener) {
        const eventListeners = listeners.get(eventName) || new Set();
        eventListeners.add(listener);
        listeners.set(eventName, eventListeners);
        return provider;
      },
      removeListener(eventName, listener) {
        listeners.get(eventName)?.delete(listener);
        return provider;
      },
      async request({ method, params = [] }) {
        if (method === "eth_accounts") {
          return sessionStorage.getItem("aegis:qa-wallet-authorized") === "true"
            ? rpcRequest("eth_accounts")
            : [];
        }
        if (method === "eth_requestAccounts") {
          sessionStorage.setItem("aegis:qa-wallet-authorized", "true");
          return rpcRequest("eth_accounts");
        }
        if (method === "wallet_switchEthereumChain") {
          const chainId = await rpcRequest("eth_chainId");
          if (params[0]?.chainId !== chainId) {
            const error = new Error("Requested chain is unavailable in the QA wallet.");
            error.code = 4902;
            throw error;
          }
          listeners.get("chainChanged")?.forEach((listener) => listener(chainId));
          return null;
        }
        if (method === "wallet_addEthereumChain") return null;
        return rpcRequest(method, params);
      },
    };

    Object.defineProperty(window, "ethereum", {
      configurable: false,
      value: provider,
      writable: false,
    });
  }, { rpcUrl: RPC_URL });
}

export async function connectWallet(page) {
  await page.getByRole("button", { exact: true, name: "Connect wallet" }).click();
  await page.getByTitle(/Select to disconnect/i).waitFor();
}
