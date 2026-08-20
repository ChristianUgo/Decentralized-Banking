import { formatAmount, formatPercent } from "@/lib/format";

function ProtocolRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-white/7 py-4 last:border-0">
      <dt className="text-sm text-mist-300">{label}</dt>
      <dd className="text-right font-mono text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}

export function ProtocolOverview({ data }) {
  const protocol = data?.protocol;
  return (
    <section className="rounded-[2rem] border border-white/9 bg-white/[0.035] p-7 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-300">
            Protocol pulse
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Live market state</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-mist-300">
          Block {data?.blockNumber ?? "—"}
        </span>
      </div>
      <dl className="mt-5">
        <ProtocolRow
          label="Total collateral"
          value={`${formatAmount(protocol?.totalCollateral, { maxFraction: 3 })} ETH`}
        />
        <ProtocolRow
          label="Collateral value"
          value={`$${formatAmount(protocol?.totalCollateralValue, { maxFraction: 2 })}`}
        />
        <ProtocolRow
          label="Outstanding debt"
          value={`${formatAmount(protocol?.totalBorrowed, { maxFraction: 2 })} DBUSD`}
        />
        <ProtocolRow label="Utilization" value={formatPercent(protocol?.utilizationRate)} />
        <ProtocolRow label="Current borrow APR" value={formatPercent(protocol?.borrowRate)} />
        <ProtocolRow
          label="Oracle ETH price"
          value={`$${formatAmount(protocol?.ethUsdPrice, { decimals: 8, maxFraction: 2 })}`}
        />
      </dl>
    </section>
  );
}
