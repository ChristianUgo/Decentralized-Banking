import { formatAmount, formatHealthFactor } from "@/lib/format";

function PreviewMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
      <p className="text-xs text-mist-300">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

export function ImpactPreview({ action, preview }) {
  const collateralAction = action === "deposit" || action === "withdraw";
  return (
    <section className="rounded-[1.75rem] border border-white/9 bg-ink-900/55 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-white">Estimated position after confirmation</h2>
        <span className="rounded-full bg-electric-300/10 px-3 py-1 text-xs font-semibold text-electric-300">Preview</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <PreviewMetric
          label={collateralAction ? "Collateral" : "Debt"}
          value={collateralAction
            ? `${formatAmount(preview?.collateralAmount, { maxFraction: 4 })} ETH`
            : `${formatAmount(preview?.debt, { maxFraction: 2 })} DBUSD`}
        />
        <PreviewMetric label="Available credit" value={`${formatAmount(preview?.borrowingPower, { maxFraction: 2 })} DBUSD`} />
        <PreviewMetric label="Health factor" value={formatHealthFactor(preview?.healthFactor)} />
      </div>
      <p className="mt-4 text-xs leading-5 text-mist-300">
        This estimate mirrors the current contract formula. The contract re-checks price, interest, and safety when the transaction executes.
      </p>
    </section>
  );
}
