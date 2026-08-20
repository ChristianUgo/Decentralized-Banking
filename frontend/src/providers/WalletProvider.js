"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import { targetChain } from "@/lib/chain";
import { walletStore } from "@/lib/wallet-store";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const snapshot = useSyncExternalStore(
    walletStore.subscribe,
    walletStore.getSnapshot,
    walletStore.getServerSnapshot,
  );

  useEffect(() => {
    void walletStore.initialize();
  }, []);

  const value = useMemo(
    () => ({
      ...snapshot,
      connect: walletStore.connect,
      disconnect: walletStore.disconnect,
      isSupported: snapshot.chainId === targetChain.id,
      switchNetwork: walletStore.switchNetwork,
      targetChain,
    }),
    [snapshot],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider.");
  return context;
}
