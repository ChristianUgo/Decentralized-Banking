"use client";

import { useState } from "react";

import { WalletCallout } from "@/components/dashboard/WalletCallout";
import { ActionLayout } from "@/components/transaction/ActionLayout";
import { ReviewPanel } from "@/components/transaction/ReviewPanel";
import { useProtocolReads } from "@/hooks/useProtocolReads";
import { liquidationReward } from "@/lib/calculations";
import { formatAmount, formatHealthFactor, shortenAddress } from "@/lib/format";
import { isTransactionBusy } from "@/lib/transaction-state";
import { validateBorrowerAddress } from "@/lib/validators";
import { useTransaction } from "@/providers/TransactionProvider";
import { useWallet } from "@/providers/WalletProvider";

function PositionRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/7 py-3 last:border-0">
      <dt className="text-sm text-mist-300">{label}</dt>
      <dd className="text-right text-sm font-semibold tabular-nums text-white">{value}</dd>
    </div>
  );
}

export function LiquidationWorkspace() {
  const wallet = useWallet();
  const transaction = useTransaction();
  const [query, setQuery] = useState("");
  const [borrower, setBorrower] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const walletAccount = wallet.status === "connected" ? wallet.account : null;
  const { data: liquidatorData } = useProtocolReads(walletAccount);
  const { data: borrowerData, error: borrowerError, status } = useProtocolReads(borrower);
  const candidate = borrower ? borrowerData?.account : null;
  const debtToRepay = BigInt(candidate?.maxLiquidatableDebt ?? 0n);
  const reward = liquidationReward(
    debtToRepay,
    candidate?.collateralAmount ?? 0n,
    borrowerData?.protocol.ethUsdPrice,
  );
  const walletBalance = BigInt(liquidatorData?.account?.stablecoinBalance ?? 0n);
  const busy = isTransactionBusy(transaction.state.status);
  const ownsTransaction = transaction.state.action === "liquidate";
  const eligible = Boolean(candidate?.isLiquidatable && debtToRepay > 0n);
  const funded = walletBalance >= debtToRepay;

  const search = (event) => {
    event.preventDefault();
    const result = validateBorrowerAddress(query);
    setSearchError(result.error);
    if (result.error) return;
    transaction.reset();
    setAcknowledged(false);
    setBorrower(result.address);
  };

  const review = async () => {
    if (!borrower || !eligible || !funded || !acknowledged || wallet.status !== "connected") return;
    await transaction.prepare(
      "liquidate",
      { borrower },
      {
        rows: [
          ["Borrower", shortenAddress(borrower, 7)],
          ["Debt repaid", `${formatAmount(debtToRepay, { maxFraction: 4 })} DBUSD`],
          ["Estimated collateral", `${formatAmount(reward.collateral, { maxFraction: 6 })} ETH`],
          ["Included bonus", `${formatAmount(reward.bonus, { maxFraction: 6 })} ETH`],
          ["Network", wallet.targetChain.name],
        ],
      },
    );
  };

  const aside = (
    <section className="rounded-[1.75rem] border border-white/9 bg-ink-900/60 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-300">Liquidator wallet</p>
      <dl className="mt-4">
        <PositionRow label="Account" value={shortenAddress(wallet.account, 6)} />
        <PositionRow label="DBUSD available" value={`${formatAmount(walletBalance, { maxFraction: 4 })} DBUSD`} />
        <PositionRow label="Protocol bonus" value="7%" />
        <PositionRow label="Close factor" value="100%" />
      </dl>
      <p className="mt-4 text-xs leading-5 text-mist-300">
        The contract limits repayment to the lesser of eligible debt and collateral-backed value. Estimates can change before execution.
      </p>
    </section>
  );

  return (
    <ActionLayout
      aside={aside}
      description="Inspect a borrower’s on-chain position, confirm liquidation eligibility, and review the exact DBUSD cost and estimated ETH reward before signing."
      eyebrow="Protocol liquidation"
      title="Resolve unhealthy debt transparently."
    >
      <div className="space-y-5">
        <WalletCallout />
        <section className="rounded-[2rem] border border-white/10 bg-ink-900/72 p-5 shadow-panel sm:p-8">
          <form onSubmit={search}>
            <label className="text-sm font-semibold text-white" htmlFor="borrower-address">Borrower address</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                aria-describedby={searchError ? "borrower-error" : undefined}
                aria-invalid={Boolean(searchError)}
                className="min-h-13 min-w-0 flex-1 rounded-2xl border border-white/12 bg-ink-950/65 px-4 font-mono text-base text-white outline-none placeholder:text-mist-300/45 focus:border-electric-300/55"
                disabled={busy}
                id="borrower-address"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="0x…"
                spellCheck="false"
                value={query}
              />
              <button className="min-h-13 rounded-full bg-white px-6 text-sm font-semibold text-ink-950 transition hover:bg-electric-300 disabled:opacity-50" disabled={busy} type="submit">
                Inspect position
              </button>
            </div>
            {searchError && <p className="mt-3 text-sm text-signal-red" id="borrower-error" role="alert">{searchError}</p>}
          </form>

          {borrower && status === "loading" && <p className="mt-6 text-sm text-mist-300" aria-live="polite">Reading borrower state…</p>}
          {borrowerError && <p className="mt-6 rounded-2xl bg-signal-red/8 p-4 text-sm text-signal-red" role="alert">{borrowerError}</p>}
          {candidate && (
            <div className="mt-7 border-t border-white/8 pt-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Borrower position</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${eligible ? "bg-signal-red/12 text-signal-red" : "bg-signal-green/10 text-signal-green"}`}>
                  {eligible ? "Liquidatable" : "Healthy / ineligible"}
                </span>
              </div>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                <PositionRow label="Collateral" value={`${formatAmount(candidate.collateralAmount, { maxFraction: 5 })} ETH`} />
                <PositionRow label="Current debt" value={`${formatAmount(candidate.borrowedAmount, { maxFraction: 4 })} DBUSD`} />
                <PositionRow label="Health factor" value={formatHealthFactor(candidate.healthFactor)} />
                <PositionRow label="Maximum repayable" value={`${formatAmount(debtToRepay, { maxFraction: 4 })} DBUSD`} />
                <PositionRow label="Estimated ETH received" value={`${formatAmount(reward.collateral, { maxFraction: 6 })} ETH`} />
                <PositionRow label="Estimated bonus" value={`${formatAmount(reward.bonus, { maxFraction: 6 })} ETH`} />
              </dl>
              {eligible && !funded && (
                <p className="mt-5 rounded-2xl bg-signal-amber/10 p-4 text-sm text-signal-amber" role="alert">
                  The connected wallet needs {formatAmount(debtToRepay, { maxFraction: 4 })} DBUSD to execute this liquidation.
                </p>
              )}
              {eligible && (
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/9 bg-white/[0.035] p-4 text-sm leading-6 text-mist-200">
                  <input className="mt-1 size-4 accent-electric-300" checked={acknowledged} disabled={busy} onChange={(event) => setAcknowledged(event.target.checked)} type="checkbox" />
                  I understand that price, interest, gas, and the final collateral reward can change before confirmation.
                </label>
              )}
              <button
                className="mt-5 min-h-13 w-full rounded-full bg-signal-red px-6 text-sm font-semibold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!eligible || !funded || !acknowledged || wallet.status !== "connected" || busy || transaction.state.status === "reviewing"}
                onClick={() => void review()}
                type="button"
              >
                {transaction.state.status === "preparing" ? "Running preflight…" : "Review liquidation"}
              </button>
            </div>
          )}
        </section>
        {ownsTransaction && <ReviewPanel onEdit={transaction.reset} onSubmit={transaction.submit} state={transaction.state} />}
      </div>
    </ActionLayout>
  );
}
