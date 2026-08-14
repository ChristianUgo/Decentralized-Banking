import Link from "next/link";

import { primaryNavigation } from "@/lib/navigation";

import { Container } from "./Container";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/82 backdrop-blur-xl">
      <Container className="flex min-h-18 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {primaryNavigation.map(({ href, label }) => (
            <Link
              className="rounded-full px-3 py-2 text-sm text-mist-300 transition hover:bg-white/6 hover:text-white"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-mist-300 sm:inline">
            Wallet integration · Stage 4
          </span>
          <button
            className="min-h-10 rounded-full border border-electric-300/25 bg-electric-300/8 px-4 text-sm font-semibold text-electric-300 opacity-70"
            disabled
            type="button"
          >
            Connect wallet
          </button>
        </div>
      </Container>
    </header>
  );
}

