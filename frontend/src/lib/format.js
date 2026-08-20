import { formatUnits, MaxUint256 } from "ethers";

export const WAD = 10n ** 18n;

function groupWholeNumber(value) {
  const sign = value.startsWith("-") ? "-" : "";
  const unsigned = sign ? value.slice(1) : value;
  return sign + unsigned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatAmount(value, { decimals = 18, maxFraction = 4 } = {}) {
  if (value === null || value === undefined) return "—";
  const [whole, fraction = ""] = formatUnits(BigInt(value), decimals).split(".");
  const trimmed = fraction.slice(0, maxFraction).replace(/0+$/, "");
  return `${groupWholeNumber(whole)}${trimmed ? `.${trimmed}` : ""}`;
}

export function formatPercent(value, maxFraction = 2) {
  if (value === null || value === undefined) return "—";
  return `${formatAmount(BigInt(value) * 100n, { maxFraction })}%`;
}

export function formatHealthFactor(value) {
  if (value === null || value === undefined) return "—";
  if (BigInt(value) === MaxUint256) return "No debt";
  return formatAmount(value, { maxFraction: 2 });
}

export function shortenAddress(address, visible = 4) {
  if (!address) return "Not connected";
  return `${address.slice(0, visible + 2)}…${address.slice(-visible)}`;
}

export function getHealthState(debt, healthFactor) {
  if (!debt || BigInt(debt) === 0n) {
    return { label: "No debt", tone: "safe", progress: 100 };
  }

  const factor = BigInt(healthFactor);
  if (factor < WAD) return { label: "Liquidatable", tone: "danger", progress: 12 };
  if (factor < 11n * 10n ** 17n) return { label: "At risk", tone: "danger", progress: 28 };
  if (factor < 15n * 10n ** 17n) return { label: "Watch", tone: "warning", progress: 58 };
  return { label: "Healthy", tone: "safe", progress: 88 };
}
