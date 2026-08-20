import {
  getWalletChainParameters,
  parseChainId,
  targetChain,
} from "./chain";

const INITIAL_SNAPSHOT = Object.freeze({
  account: null,
  chainId: null,
  error: null,
  status: "checking",
});

function getErrorCode(error) {
  const code = error?.code ?? error?.info?.error?.code;
  return typeof code === "string" ? Number(code) : code;
}

export function getWalletErrorMessage(error) {
  const code = getErrorCode(error);
  if (code === 4001) return "The wallet request was rejected.";
  if (code === -32002) return "A wallet request is already waiting for approval.";
  return error?.shortMessage || error?.message || "The wallet request failed.";
}

function deriveSession(accounts, rawChainId, chain) {
  const account = Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
  const chainId = parseChainId(rawChainId);

  if (!account) return { account: null, chainId, error: null, status: "disconnected" };
  if (chainId !== chain.id) return { account, chainId, error: null, status: "unsupported" };
  return { account, chainId, error: null, status: "connected" };
}

export function createWalletStore({
  chain = targetChain,
  getProvider = () => globalThis.window?.ethereum ?? null,
} = {}) {
  let snapshot = INITIAL_SNAPSHOT;
  let provider = null;
  let listenersBound = false;
  const listeners = new Set();

  const emit = (nextSnapshot) => {
    snapshot = Object.freeze(nextSnapshot);
    listeners.forEach((listener) => listener());
  };

  const refreshSession = async () => {
    const [accounts, rawChainId] = await Promise.all([
      provider.request({ method: "eth_accounts" }),
      provider.request({ method: "eth_chainId" }),
    ]);
    emit(deriveSession(accounts, rawChainId, chain));
  };

  const handleAccountsChanged = (accounts) => {
    emit(deriveSession(accounts, snapshot.chainId, chain));
  };

  const handleChainChanged = (rawChainId) => {
    const accounts = snapshot.account ? [snapshot.account] : [];
    emit(deriveSession(accounts, rawChainId, chain));
  };

  const bindListeners = () => {
    if (listenersBound || typeof provider?.on !== "function") return;
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    listenersBound = true;
  };

  const initialize = async () => {
    provider = getProvider();
    if (!provider) {
      emit({ account: null, chainId: null, error: null, status: "unavailable" });
      return;
    }

    bindListeners();
    try {
      await refreshSession();
    } catch (error) {
      emit({
        account: null,
        chainId: null,
        error: getWalletErrorMessage(error),
        status: "error",
      });
    }
  };

  const connect = async () => {
    provider = provider || getProvider();
    if (!provider) {
      emit({ account: null, chainId: null, error: null, status: "unavailable" });
      return;
    }

    bindListeners();
    emit({ ...snapshot, error: null, status: "connecting" });
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const rawChainId = await provider.request({ method: "eth_chainId" });
      emit(deriveSession(accounts, rawChainId, chain));
    } catch (error) {
      emit({ ...snapshot, error: getWalletErrorMessage(error), status: "error" });
    }
  };

  const switchNetwork = async () => {
    provider = provider || getProvider();
    if (!provider) return initialize();

    emit({ ...snapshot, error: null, status: "switching" });
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chain.hexId }],
      });
    } catch (error) {
      if (getErrorCode(error) !== 4902) {
        emit({ ...snapshot, error: getWalletErrorMessage(error), status: "error" });
        return;
      }

      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [getWalletChainParameters(chain)],
        });
      } catch (addError) {
        emit({ ...snapshot, error: getWalletErrorMessage(addError), status: "error" });
        return;
      }
    }

    try {
      await refreshSession();
    } catch (error) {
      emit({ ...snapshot, error: getWalletErrorMessage(error), status: "error" });
    }
  };

  const disconnect = () => {
    emit({ account: null, chainId: snapshot.chainId, error: null, status: "disconnected" });
  };

  return Object.freeze({
    connect,
    disconnect,
    getServerSnapshot: () => INITIAL_SNAPSHOT,
    getSnapshot: () => snapshot,
    initialize,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    switchNetwork,
  });
}

export const walletStore = createWalletStore();
