"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";

import { getTransactionErrorMessage, prepareProtocolTransaction } from "@/lib/transaction-client";
import { initialTransactionState, transactionReducer } from "@/lib/transaction-state";
import { useWallet } from "@/providers/WalletProvider";

const TransactionContext = createContext(null);

export function TransactionProvider({ children }) {
  const wallet = useWallet();
  const [state, dispatch] = useReducer(transactionReducer, initialTransactionState);
  const preparedExecution = useRef(null);
  const requestId = useRef(0);
  const walletKey = `${wallet.account || "none"}:${wallet.chainId || "none"}`;
  const previousWalletKey = useRef(walletKey);

  const reset = useCallback(() => {
    requestId.current += 1;
    preparedExecution.current = null;
    dispatch({ type: "RESET" });
  }, []);

  useEffect(() => {
    if (previousWalletKey.current !== walletKey) reset();
    previousWalletKey.current = walletKey;
  }, [reset, walletKey]);

  const prepare = useCallback(
    async (action, parameters, summary) => {
      const currentRequest = ++requestId.current;
      preparedExecution.current = null;
      dispatch({ action, type: "PREPARING" });
      try {
        const prepared = await prepareProtocolTransaction({
          action,
          expectedAccount: wallet.account,
          ...parameters,
        });
        if (currentRequest !== requestId.current) return false;
        preparedExecution.current = prepared.execute;
        dispatch({
          estimatedFee: prepared.estimatedFee,
          gasEstimate: prepared.gasEstimate,
          summary,
          type: "REVIEW",
        });
        return true;
      } catch (error) {
        if (currentRequest === requestId.current) {
          dispatch({ error: getTransactionErrorMessage(error), type: "FAILED" });
        }
        return false;
      }
    },
    [wallet.account],
  );

  const submit = useCallback(async () => {
    if (!preparedExecution.current) return false;
    const currentRequest = requestId.current;
    dispatch({ type: "SIGNING" });
    try {
      const transaction = await preparedExecution.current();
      if (currentRequest !== requestId.current) return false;
      dispatch({ hash: transaction.hash, type: "SUBMITTED" });
      const receipt = await transaction.wait();
      if (receipt?.status !== 1) throw new Error("The transaction reverted before confirmation.");
      if (currentRequest !== requestId.current) return false;
      preparedExecution.current = null;
      dispatch({ receipt, type: "CONFIRMED" });
      globalThis.dispatchEvent(new Event("aegis:transaction-confirmed"));
      return true;
    } catch (error) {
      if (currentRequest === requestId.current) {
        dispatch({ error: getTransactionErrorMessage(error), type: "FAILED" });
      }
      return false;
    }
  }, []);

  const value = useMemo(() => ({ prepare, reset, state, submit }), [prepare, reset, state, submit]);
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) throw new Error("useTransaction must be used inside TransactionProvider.");
  return context;
}
