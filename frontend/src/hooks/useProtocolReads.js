"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getProtocolErrorMessage, getProtocolReader } from "@/lib/protocol-client";

const REFRESH_INTERVAL = 15_000;

export function useProtocolReads(accountAddress = null) {
  const [state, setState] = useState({ data: null, error: null, status: "loading" });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setState((current) => ({ ...current, status: "loading" }));

    try {
      const data = await getProtocolReader()(accountAddress);
      if (currentRequest === requestId.current) {
        setState({ data, error: null, status: "success" });
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setState((current) => ({
          ...current,
          error: getProtocolErrorMessage(error),
          status: "error",
        }));
      }
    }
  }, [accountAddress]);

  useEffect(() => {
    void load();
    const interval = globalThis.setInterval(() => void load(), REFRESH_INTERVAL);
    const refreshAfterTransaction = () => void load();
    globalThis.addEventListener("aegis:transaction-confirmed", refreshAfterTransaction);
    return () => {
      requestId.current += 1;
      globalThis.clearInterval(interval);
      globalThis.removeEventListener("aegis:transaction-confirmed", refreshAfterTransaction);
    };
  }, [load]);

  return { ...state, refresh: load };
}
