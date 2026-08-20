import { Container } from "./Container";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 py-10">
      <Container className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p className="max-w-xl text-sm leading-6 text-mist-300 sm:text-right">
          Local-development protocol. Contracts are unaudited and no real funds should be used.
        </p>
      </Container>
    </footer>
  );
}
