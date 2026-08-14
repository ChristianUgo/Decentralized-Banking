import Link from "next/link";

import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <main id="main-content" className="py-28">
      <Container className="text-center">
        <p className="font-mono text-sm text-electric-300">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">Route not found.</h1>
        <p className="mx-auto mt-4 max-w-lg text-mist-300">
          The requested protocol screen does not exist in this release.
        </p>
        <Link className="mt-8 inline-flex rounded-full bg-electric-300 px-6 py-3 font-semibold text-ink-950" href="/">
          Return home
        </Link>
      </Container>
    </main>
  );
}

