export function DashboardMetric({ detail, label, value }) {
  return (
    <article className="min-w-0 rounded-3xl border border-white/9 bg-white/[0.035] p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-mist-300">{label}</p>
      <p className="mt-5 truncate font-mono text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-mist-300">{detail}</p>
    </article>
  );
}
