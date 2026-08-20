"use client";

import { useProtocolReads } from "@/hooks/useProtocolReads";
import { formatAmount, formatHealthFactor } from "@/lib/format";
import { useWallet } from "@/providers/WalletProvider";

import { Metric } from "../Metric";

export function ProtocolPreview() {
  const wallet = useWallet();
  const readableAccount = wallet.status === "connected" ? wallet.account : null;
  const { data, error, status } = useProtocolReads(readableAccount);
  const position = data?.account;
  const connected = Boolean(position);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-ink-900/88 shadow-panel backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mist-300">
            {connected ? "Connected position" : "Protocol pulse"}
          </p>
          <p className="mt-1 text-sm text-mist-300">
            {error ? "Read layer unavailable" : status === "loading" ? "Resolving on-chain data" : wallet.targetChain.name}
          </p>
        </div>
        <span className="rounded-full border border-signal-green/20 bg-signal-green/8 px-3 py-1 text-xs font-medium text-signal-green">
          Read-only
        </span>
      </div>
      <div className="grid gap-px bg-white/8 sm:grid-cols-3">
        <Metric
          detail="ETH"
          label={connected ? "Collateral" : "Protocol collateral"}
          value={formatAmount(
            connected ? position.collateralAmount : data?.protocol.totalCollateral,
            { maxFraction: 3 },
          )}
        />
        <Metric
          detail="DBUSD"
          label={connected ? "Debt" : "Protocol debt"}
          value={formatAmount(
            connected ? position.borrowedAmount : data?.protocol.totalBorrowed,
            { maxFraction: 2 },
          )}
        />
        <Metric
          detail={connected ? "Liquidation below 1.00" : "Current variable APR"}
          label={connected ? "Health" : "Borrow rate"}
          value={
            connected
              ? formatHealthFactor(position.healthFactor)
              : data?.protocol.borrowRate === undefined
                ? "—"
                : `${formatAmount(data.protocol.borrowRate * 100n, { maxFraction: 2 })}%`
          }
        />
      </div>
      <div className="p-6">
        <div className="mb-3 flex justify-between text-xs font-medium text-mist-300">
          <span>Read layer</span>
          <span>{data?.blockNumber ? `Block ${data.blockNumber}` : "Waiting for local RPC"}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-electric-500 to-electric-300" />
        </div>
        <p className="mt-5 rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-sm leading-6 text-mist-300">
          {error
            ? error
            : connected
              ? "Position values resolve from the deployed contracts and refresh automatically."
              : "Connect a supported wallet for account health, or continue with protocol-wide read-only data."}
        </p>
      </div>
    </div>
  );
}
