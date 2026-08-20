import { formatHealthFactor, getHealthState } from "@/lib/format";

const toneStyles = {
  danger: {
    badge: "border-signal-red/25 bg-signal-red/10 text-signal-red",
    bar: "bg-signal-red",
  },
  safe: {
    badge: "border-signal-green/25 bg-signal-green/10 text-signal-green",
    bar: "bg-signal-green",
  },
  warning: {
    badge: "border-signal-amber/25 bg-signal-amber/10 text-signal-amber",
    bar: "bg-signal-amber",
  },
};

export function RiskPanel({ position }) {
  if (!position) {
    return (
      <section className="rounded-[2rem] border border-white/9 bg-ink-900/78 p-7 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-300">
          Position health
        </p>
        <h2 className="mt-5 text-2xl font-semibold text-white">Awaiting a supported wallet</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-mist-300">
          Health is calculated by the LendingPool from collateral value and current debt. No
          local estimate is shown before the account can be read on-chain.
        </p>
      </section>
    );
  }

  const health = getHealthState(position.borrowedAmount, position.healthFactor);
  const styles = toneStyles[health.tone];

  return (
    <section className="rounded-[2rem] border border-white/9 bg-ink-900/78 p-7 shadow-panel sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-300">
            Position health
          </p>
          <h2 className="mt-4 font-mono text-4xl font-semibold text-white">
            {formatHealthFactor(position.healthFactor)}
          </h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}>
          {health.label}
        </span>
      </div>
      <div className="mt-9 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${styles.bar}`}
          style={{ width: `${health.progress}%` }}
        />
      </div>
      <div className="mt-5 flex flex-wrap justify-between gap-3 text-xs text-mist-300">
        <span>Liquidation below 1.00</span>
        <span>{position.isLiquidatable ? "Eligible for liquidation" : "Not liquidatable"}</span>
      </div>
    </section>
  );
}
