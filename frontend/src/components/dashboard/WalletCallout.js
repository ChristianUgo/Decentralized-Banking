"use client";

import { useWallet } from "@/providers/WalletProvider";

export function WalletCallout() {
  const { connect, error, status, switchNetwork, targetChain } = useWallet();

  if (status === "connected") return null;

  const unavailable = status === "unavailable";
  const unsupported = status === "unsupported";
  const busy = status === "checking" || status === "connecting" || status === "switching";
  const title = unsupported
    ? "Your wallet is on another network."
    : unavailable
      ? "No injected wallet was detected."
      : "Connect a wallet to resolve your position.";
  const description = unsupported
    ? `Switch to ${targetChain.name} before account-specific reads are displayed.`
    : unavailable
      ? "Protocol totals remain read-only, but account data requires a browser wallet."
      : error || "Connection is read-only in Stage 4; transactions remain disabled.";

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-electric-300/18 bg-electric-300/[0.055] p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-mist-300">{description}</p>
      </div>
      {!unavailable && (
        <button
          className="min-h-11 shrink-0 rounded-full bg-electric-300 px-5 text-sm font-semibold text-ink-950 transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={() => void (unsupported ? switchNetwork() : connect())}
          type="button"
        >
          {unsupported ? "Switch network" : busy ? "Check wallet" : "Connect wallet"}
        </button>
      )}
    </section>
  );
}
