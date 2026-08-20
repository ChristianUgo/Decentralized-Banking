import { formatAmount } from "@/lib/format";
import { isTransactionBusy } from "@/lib/transaction-state";

export function ReviewPanel({ onEdit, onSubmit, state }) {
  if (state.status !== "reviewing" && state.status !== "signing" && state.status !== "submitted") return null;
  const busy = isTransactionBusy(state.status);

  return (
    <section className="rounded-[1.75rem] border border-electric-300/25 bg-electric-300/[0.055] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-300">Wallet checkpoint</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Final transaction review</h2>
      <dl className="mt-5 space-y-3 text-sm">
        {state.summary?.rows?.map(([label, value]) => (
          <div className="grid min-w-0 grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] items-start gap-4" key={label}>
            <dt className="text-mist-300">{label}</dt>
            <dd className="break-words text-right font-semibold text-white">{value}</dd>
          </div>
        ))}
        <div className="grid min-w-0 grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] items-start gap-4 border-t border-white/9 pt-3">
          <dt className="text-mist-300">Estimated network fee</dt>
          <dd className="break-words text-right font-semibold text-white">
            {state.estimatedFee ? `${formatAmount(state.estimatedFee, { maxFraction: 6 })} ETH` : "Wallet estimate"}
          </dd>
        </div>
      </dl>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          className="min-h-12 rounded-full border border-white/12 px-5 text-sm font-semibold text-white transition hover:bg-white/7 disabled:opacity-50"
          disabled={busy}
          onClick={onEdit}
          type="button"
        >
          Edit values
        </button>
        <button
          className="min-h-12 rounded-full bg-electric-300 px-5 text-sm font-semibold text-ink-950 transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={() => void onSubmit()}
          type="button"
        >
          {state.status === "signing" ? "Check wallet…" : state.status === "submitted" ? "Confirming…" : "Confirm in wallet"}
        </button>
      </div>
    </section>
  );
}
