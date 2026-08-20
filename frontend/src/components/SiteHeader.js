import { Container } from "./Container";
import { Logo } from "./Logo";
import { PrimaryNavigation } from "./PrimaryNavigation";
import { WalletButton } from "./wallet/WalletButton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/90 backdrop-blur-xl">
      <Container className="relative flex min-h-18 items-center justify-between gap-3 sm:gap-5">
        <Logo />
        <PrimaryNavigation />
        <div className="ml-auto min-w-0 lg:ml-0">
          <WalletButton />
        </div>
      </Container>
    </header>
  );
}
