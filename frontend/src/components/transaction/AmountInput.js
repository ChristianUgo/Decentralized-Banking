export function AmountInput({ disabled, error, label, maxLabel, onChange, onMax, symbol, value }) {
  const errorId = `${label.toLowerCase().replace(/\s+/g, "-")}-error`;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <label className="text-sm font-semibold text-white" htmlFor="transaction-amount">{label}</label>
        <button
          className="text-xs font-semibold text-electric-300 transition hover:text-white disabled:opacity-50"
          disabled={disabled || !onMax}
          onClick={onMax}
          type="button"
        >
          Max {maxLabel}
        </button>
      </div>
      <div className="flex min-h-16 items-center rounded-2xl border border-white/12 bg-ink-950/65 px-5 focus-within:border-electric-300/55">
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tabular-nums text-white outline-none placeholder:text-mist-300/45 disabled:cursor-not-allowed"
          disabled={disabled}
          id="transaction-amount"
          inputMode="decimal"
          onChange={(event) => onChange(event.target.value)}
          placeholder="0.00"
          type="text"
          value={value}
        />
        <span className="ml-4 text-sm font-semibold text-mist-200">{symbol}</span>
      </div>
      {error && <p className="mt-3 text-sm leading-6 text-signal-red" id={errorId} role="alert">{error}</p>}
    </div>
  );
}
