"use client";

import { formatAmount, shortenAddress } from "@/lib/format";
import { ACTION_LABELS } from "@/lib/transaction-client";
import { isTransactionBusy } from "@/lib/transaction-state";
import { useTransaction } from "@/providers/TransactionProvider";
import { useWallet } from "@/providers/WalletProvider";

const statusCopy = {
  confirmed: ["Confirmed on-chain", "The affected balances are being refreshed."],
  error: ["Transaction stopped", "Review the message below and retry when ready."],
  preparing: ["Running preflight", "Simulating the call and estimating gas."],
  reviewing: ["Ready for review", "Confirm only after checking the final values."],
  signing: ["Check your wallet", "Review the exact action before signing."],
  submitted: ["Confirmation pending", "The transaction was submitted to the network."],
};

export function TransactionStatus() {
  const { reset, state } = useTransaction();
  const { targetChain } = useWallet();
  if (state.status === "idle") return null;

  const [title, description] = statusCopy[state.status];
  const explorerHref = state.hash && targetChain.explorerUrl
    ? `${targetChain.explorerUrl.replace(/\/$/, "")}/tx/${state.hash}`
    : null;

  return (
    <aside
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-[1.75rem] border border-white/12 bg-ink-900/95 p-5 shadow-panel backdrop-blur-xl sm:left-auto sm:mx-0 sm:right-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-300">
            {ACTION_LABELS[state.action] || "Protocol transaction"}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-mist-300">{description}</p>
        </div>
        {!isTransactionBusy(state.status) && (
          <button
            aria-label="Close transaction status"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-mist-300 transition hover:bg-white/8 hover:text-white"
            onClick={reset}
            type="button"
          >
            ×
          </button>
        )}
      </div>
      {state.gasEstimate && (
        <p className="mt-4 text-xs text-mist-300">
          Estimated gas {state.gasEstimate.toString()}
          {state.estimatedFee ? ` · up to ${formatAmount(state.estimatedFee, { maxFraction: 6 })} ETH` : ""}
        </p>
      )}
      {state.hash && (
        <p className="mt-3 break-all font-mono text-xs text-mist-200">
          {explorerHref ? <a className="underline" href={explorerHref} rel="noreferrer" target="_blank">View {shortenAddress(state.hash, 8)}</a> : state.hash}
        </p>
      )}
      {state.error && <p className="mt-4 rounded-xl bg-signal-red/10 p-3 text-sm text-signal-red" role="alert">{state.error}</p>}
    </aside>
  );
}
