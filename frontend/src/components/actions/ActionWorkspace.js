"use client";

import { formatUnits } from "ethers";
import Link from "next/link";
import { useMemo, useState } from "react";

import { WalletCallout } from "@/components/dashboard/WalletCallout";
import { ActionLayout } from "@/components/transaction/ActionLayout";
import { AmountInput } from "@/components/transaction/AmountInput";
import { ImpactPreview } from "@/components/transaction/ImpactPreview";
import { ReviewPanel } from "@/components/transaction/ReviewPanel";
import { useProtocolReads } from "@/hooks/useProtocolReads";
import { formatAmount, formatHealthFactor } from "@/lib/format";
import { previewPosition } from "@/lib/calculations";
import { isTransactionBusy } from "@/lib/transaction-state";
import { getActionMaximum, validateActionAmount } from "@/lib/validators";
import { useTransaction } from "@/providers/TransactionProvider";
import { useWallet } from "@/providers/WalletProvider";

const copy = {
  borrow: {
    description: "Choose the DBUSD amount, inspect your new debt and health factor, then simulate the exact contract call before signing.",
    eyebrow: "Stablecoin credit",
    title: "Borrow with your risk visible.",
  },
  collateral: {
    description: "Move ETH into or out of the vault with wallet balance, borrowing power and post-transaction safety shown before signing.",
    eyebrow: "Collateral",
    title: "Manage collateral with a clear preflight.",
  },
  repay: {
    description: "Repay partially or close your debt. DBUSD is burned directly by the LendingPool, so this protocol does not require a separate approval transaction.",
    eyebrow: "Debt management",
    title: "Repay without hidden steps.",
  },
};

function CurrentPosition({ data, position }) {
  return (
    <section className="rounded-[1.75rem] border border-white/9 bg-ink-900/60 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-300">Current position</p>
      <dl className="mt-5 space-y-4 text-sm">
        {[
          ["Wallet ETH", `${formatAmount(position?.walletEthBalance, { maxFraction: 4 })} ETH`],
          ["Collateral", `${formatAmount(position?.collateralAmount, { maxFraction: 4 })} ETH`],
          ["Debt", `${formatAmount(position?.borrowedAmount, { maxFraction: 2 })} DBUSD`],
          ["DBUSD balance", `${formatAmount(position?.stablecoinBalance, { maxFraction: 2 })} DBUSD`],
          ["Health factor", formatHealthFactor(position?.healthFactor)],
          ["Borrow APR", `${formatAmount((data?.protocol.borrowRate ?? 0n) * 100n, { maxFraction: 2 })}%`],
        ].map(([label, value]) => (
          <div className="grid min-w-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-4" key={label}>
            <dt className="text-mist-300">{label}</dt>
            <dd className="break-words text-right font-semibold tabular-nums text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ActionWorkspace({ kind }) {
  const wallet = useWallet();
  const transaction = useTransaction();
  const [mode, setMode] = useState("deposit");
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const action = kind === "collateral" ? mode : kind;
  const readableAccount = wallet.status === "connected" ? wallet.account : null;
  const { data, error: readError, status } = useProtocolReads(readableAccount);
  const position = data?.account;
  const maximum = getActionMaximum(action, position);
  const validation = useMemo(
    () => validateActionAmount(action, value, position, data?.protocol.ethUsdPrice),
    [action, data?.protocol.ethUsdPrice, position, value],
  );
  const preview = previewPosition(
    action,
    validation.amount ?? 0n,
    position,
    data?.protocol.ethUsdPrice,
  );
  const busy = isTransactionBusy(transaction.state.status);
  const locked = busy || transaction.state.status === "reviewing";
  const ownsTransaction = transaction.state.action === action;
  const pageCopy = copy[kind];

  const changeValue = (nextValue) => {
    if (transaction.state.status === "error" || transaction.state.status === "confirmed") transaction.reset();
    setValue(nextValue);
    setTouched(false);
  };

  const changeMode = (nextMode) => {
    transaction.reset();
    setMode(nextMode);
    setValue("");
    setTouched(false);
  };

  const review = async () => {
    setTouched(true);
    if (wallet.status !== "connected" || validation.error) return;
    await transaction.prepare(
      action,
      { amount: validation.amount },
      {
        rows: [
          ["Action", action[0].toUpperCase() + action.slice(1)],
          ["Amount", `${formatAmount(validation.amount, { maxFraction: 6 })} ${action === "deposit" || action === "withdraw" ? "ETH" : "DBUSD"}`],
          ["Network", wallet.targetChain.name],
          ["Estimated health", formatHealthFactor(preview.healthFactor)],
        ],
      },
    );
  };

  return (
    <ActionLayout
      aside={<CurrentPosition data={data} position={position} />}
      description={pageCopy.description}
      eyebrow={pageCopy.eyebrow}
      title={pageCopy.title}
    >
      <div className="space-y-5">
        <WalletCallout />
        {readError && <p className="rounded-2xl border border-signal-red/25 bg-signal-red/8 p-4 text-sm text-signal-red" role="alert">{readError}</p>}
        <section className="rounded-[2rem] border border-white/10 bg-ink-900/72 p-5 shadow-panel sm:p-8">
          {kind === "collateral" && (
            <div className="mb-7 grid grid-cols-2 rounded-full border border-white/10 bg-ink-950/65 p-1" aria-label="Collateral action" role="group">
              {["deposit", "withdraw"].map((option) => (
                <button
                  aria-pressed={mode === option}
                  className={`min-h-11 rounded-full text-sm font-semibold capitalize transition ${mode === option ? "bg-electric-300 text-ink-950" : "text-mist-300 hover:text-white"}`}
                  disabled={locked}
                  key={option}
                  onClick={() => changeMode(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          <AmountInput
            disabled={locked || wallet.status !== "connected" || status === "loading"}
            error={touched ? validation.error : null}
            label={`${action[0].toUpperCase() + action.slice(1)} amount`}
            maxLabel={`${formatAmount(maximum, { maxFraction: 4 })} ${action === "deposit" || action === "withdraw" ? "ETH" : "DBUSD"}`}
            onChange={changeValue}
            onMax={() => changeValue(formatUnits(maximum, 18))}
            symbol={action === "deposit" || action === "withdraw" ? "ETH" : "DBUSD"}
            value={value}
          />
          <button
            aria-describedby={touched && validation.error ? `${action}-amount-field-error` : undefined}
            className="mt-6 min-h-13 w-full rounded-full bg-electric-300 px-6 text-sm font-semibold text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
            disabled={locked || wallet.status !== "connected" || status === "loading"}
            onClick={() => void review()}
            type="button"
          >
            {transaction.state.status === "preparing" ? "Running preflight…" : `Review ${action}`}
          </button>
          {ownsTransaction && transaction.state.status === "confirmed" && (
            <div className="mt-5 rounded-2xl border border-signal-green/25 bg-signal-green/8 p-4 text-sm text-mist-100" role="status">
              Confirmed. <Link className="font-semibold text-signal-green underline" href="/dashboard">View the refreshed dashboard</Link>.
            </div>
          )}
        </section>
        <ImpactPreview action={action} preview={preview} />
        {ownsTransaction && <ReviewPanel onEdit={transaction.reset} onSubmit={transaction.submit} state={transaction.state} />}
      </div>
    </ActionLayout>
  );
}
