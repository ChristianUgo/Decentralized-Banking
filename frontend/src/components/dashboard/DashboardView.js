"use client";

import Link from "next/link";

import { useProtocolReads } from "@/hooks/useProtocolReads";
import { formatAmount, formatHealthFactor, shortenAddress } from "@/lib/format";
import { useWallet } from "@/providers/WalletProvider";

import { Container } from "../Container";
import { DashboardMetric } from "./DashboardMetric";
import { ProtocolOverview } from "./ProtocolOverview";
import { RiskPanel } from "./RiskPanel";
import { WalletCallout } from "./WalletCallout";

const actions = [
  ["Deposit ETH", "/deposit"],
  ["Borrow DBUSD", "/borrow"],
  ["Repay debt", "/repay"],
  ["View liquidations", "/liquidity"],
];

export function DashboardView() {
  const wallet = useWallet();
  const readableAccount = wallet.status === "connected" ? wallet.account : null;
  const { data, error, refresh, status } = useProtocolReads(readableAccount);
  const position = data?.account;
  const isRefreshing = status === "loading" && Boolean(data);

  return (
    <main id="main-content" className="min-h-[72vh] py-12 sm:py-16">
      <Container>
        <div className="flex flex-col gap-7 border-b border-white/8 pb-9 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-signal-green/20 bg-signal-green/8 px-3 py-1 text-xs font-semibold text-signal-green">
                Live contract reads
              </span>
              <span className="font-mono text-xs text-mist-300">
                {wallet.account ? shortenAddress(wallet.account, 6) : wallet.targetChain.name}
              </span>
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">
              Position intelligence,
              <span className="block text-electric-300">without the guesswork.</span>
            </h1>
          </div>
          <button
            className="min-h-11 self-start rounded-full border border-white/12 bg-white/5 px-5 text-sm font-semibold text-white transition hover:border-electric-300/40 hover:bg-white/8 disabled:cursor-wait disabled:opacity-60 lg:self-auto"
            disabled={status === "loading"}
            onClick={() => void refresh()}
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh on-chain data"}
          </button>
        </div>

        <div className="mt-8">
          <WalletCallout />
        </div>

        {error && (
          <div
            className="mt-6 rounded-2xl border border-signal-red/25 bg-signal-red/8 p-5 text-sm leading-6 text-mist-100"
            role="alert"
          >
            <strong className="text-signal-red">Read layer unavailable.</strong> {error}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Account metrics">
          <DashboardMetric
            detail="Locked in the collateral vault"
            label="Collateral"
            value={`${formatAmount(position?.collateralAmount, { maxFraction: 4 })} ETH`}
          />
          <DashboardMetric
            detail="Oracle-valued collateral"
            label="Collateral value"
            value={`$${formatAmount(position?.collateralValue, { maxFraction: 2 })}`}
          />
          <DashboardMetric
            detail="Includes previewed lazy interest"
            label="Current debt"
            value={`${formatAmount(position?.borrowedAmount, { maxFraction: 2 })} DBUSD`}
          />
          <DashboardMetric
            detail="Additional debt within the 150% ratio"
            label="Available credit"
            value={`${formatAmount(position?.borrowingPower, { maxFraction: 2 })} DBUSD`}
          />
          <DashboardMetric
            detail="DBUSD held by the connected wallet"
            label="Wallet balance"
            value={`${formatAmount(position?.stablecoinBalance, { maxFraction: 2 })} DBUSD`}
          />
          <DashboardMetric
            detail="Liquidation threshold: 1.00"
            label="Health factor"
            value={formatHealthFactor(position?.healthFactor)}
          />
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <RiskPanel position={position} />
            <section className="rounded-[2rem] border border-white/9 bg-ink-900/65 p-7 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-300">
                Banking actions
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {actions.map(([label, href]) => (
                  <Link
                    className="flex min-h-12 items-center justify-between rounded-2xl border border-white/9 bg-white/[0.035] px-4 text-sm font-semibold text-white transition hover:border-electric-300/30 hover:bg-white/[0.065]"
                    href={href}
                    key={href}
                  >
                    {label}
                    <span aria-hidden="true" className="text-electric-300">→</span>
                  </Link>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-mist-300">
                Every action validates values, simulates the contract call and presents a final review before requesting a wallet signature.
              </p>
            </section>
          </div>
          <ProtocolOverview data={data} />
        </div>

        <p className="mt-6 text-right text-xs text-mist-300" aria-live="polite">
          {data?.readAt
            ? `Last resolved ${new Date(data.readAt).toLocaleTimeString()} · block ${data.blockNumber}`
            : status === "loading"
              ? "Resolving protocol state…"
              : "Waiting for protocol state"}
        </p>
      </Container>
    </main>
  );
}
