export function Metric({ label, value, detail }) {
  return (
    <div className="bg-ink-900 px-5 py-6">
      <p className="text-xs font-medium text-mist-300">{label}</p>
      <p className="mt-3 font-mono text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-mist-300">{detail}</p>
    </div>
  );
}

