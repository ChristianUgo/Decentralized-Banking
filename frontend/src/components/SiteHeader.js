import Link from "next/link";

import { primaryNavigation } from "@/lib/navigation";

import { Container } from "./Container";
import { Logo } from "./Logo";
import { WalletButton } from "./wallet/WalletButton";

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
        <WalletButton />
      </Container>
    </header>
  );
}
