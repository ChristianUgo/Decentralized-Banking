import Link from "next/link";

import deployment from "@/contracts/addresses.json";
import { primaryNavigation } from "@/lib/navigation";

import { Container } from "./Container";
import { Logo } from "./Logo";

export function SiteFooter() {
  const networkName = deployment.chainId === 11155111 ? "Ethereum Sepolia" : "Development network";
  const release = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local";

  return (
    <footer className="mt-auto border-t border-white/8 bg-ink-950/55 py-10 sm:py-12">
      <Container>
        <div className="grid gap-9 border-b border-white/8 pb-9 md:grid-cols-[1.15fr_0.85fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-6 text-mist-300">
              Non-custodial collateral, credit, repayment, and liquidation with every material action verified on-chain.
            </p>
          </div>
          <nav aria-label="Footer banking routes">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-300">Banking</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-1">
              {primaryNavigation.map(({ href, label }) => (
                <li key={href}>
                  <Link className="text-sm text-mist-300 underline-offset-4 transition hover:text-white hover:underline" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="rounded-2xl border border-signal-amber/20 bg-signal-amber/[0.055] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal-amber">{networkName} demonstration only</p>
            <p className="mt-3 text-sm leading-6 text-mist-200">
              Contracts are unaudited. Never use real funds, production keys, or a mainnet wallet with this release.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-6 text-xs text-mist-300 sm:flex-row sm:items-center sm:justify-between">
          <p>Built for transparent protocol review.</p>
          <p>On-chain state remains the source of truth · Release {release}</p>
        </div>
      </Container>
    </footer>
  );
}
