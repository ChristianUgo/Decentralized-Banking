"use client";

import { shortenAddress } from "@/lib/format";
import { useWallet } from "@/providers/WalletProvider";

export function WalletButton() {
  const { account, connect, disconnect, error, status, switchNetwork, targetChain } =
    useWallet();

  let label = "Connect wallet";
  let detail = "Wallet disconnected";
  let action = connect;
  let disabled = false;
  let dotClass = "bg-mist-300";

  if (status === "checking") {
    label = "Checking wallet";
    detail = "Detecting an injected wallet";
    disabled = true;
  } else if (status === "connecting") {
    label = "Approve in wallet";
    detail = "Connection request pending";
    disabled = true;
  } else if (status === "switching") {
    label = "Switching network";
    detail = `Switching to ${targetChain.name}`;
    disabled = true;
  } else if (status === "unavailable") {
    label = "Wallet unavailable";
    detail = "Install or enable an injected wallet";
    disabled = true;
  } else if (status === "unsupported") {
    label = "Switch network";
    detail = `Required: ${targetChain.name}`;
    action = switchNetwork;
    dotClass = "bg-signal-amber";
  } else if (status === "connected") {
    label = shortenAddress(account);
    detail = `${targetChain.name} · Select to disconnect`;
    action = disconnect;
    dotClass = "bg-signal-green";
  } else if (status === "error") {
    label = "Retry wallet";
    detail = error || "Wallet request failed";
    dotClass = "bg-signal-red";
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-xs font-medium text-white">{detail}</p>
        <p className="mt-0.5 text-[0.68rem] text-mist-300" aria-live="polite">
          {error && status === "error" ? error : "On-chain access"}
        </p>
      </div>
      <button
        aria-label={detail}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-electric-300/25 bg-electric-300/8 px-4 text-sm font-semibold text-electric-300 transition hover:border-electric-300/50 hover:bg-electric-300/14 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={disabled}
        onClick={() => void action()}
        type="button"
      >
        <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
        <span>{label}</span>
      </button>
    </div>
  );
}
