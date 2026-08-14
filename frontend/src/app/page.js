import Link from "next/link";

import { Container } from "@/components/Container";
import { Metric } from "@/components/Metric";
import { SectionHeading } from "@/components/SectionHeading";

const flow = [
  ["01", "Deposit", "Lock ETH as transparent, self-custodied collateral."],
  ["02", "Borrow", "Mint the protocol stablecoin within your borrowing capacity."],
  ["03", "Manage", "Track debt, interest, available credit and position health."],
  ["04", "Repay", "Repay at your pace and withdraw collateral when it remains safe."],
];

const principles = [
  ["Non-custodial", "Your wallet authorizes every value-moving action."],
  ["Risk first", "Projected health appears before a borrow or withdrawal signature."],
  ["On-chain truth", "Balances and protocol totals resolve from smart contracts."],
  ["Open liquidation", "Eligible unhealthy positions can be resolved transparently."],
];

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="relative overflow-hidden border-b border-white/8 pb-20 pt-14 sm:pb-28 sm:pt-20">
        <Container className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-electric-300/20 bg-electric-300/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-electric-300">
              <span className="h-1.5 w-1.5 rounded-full bg-electric-300 shadow-[0_0_16px_#71e5ff]" />
              Protocol foundation · Stage 1
            </div>
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl lg:text-[5.35rem]">
              Banking logic,
              <span className="block text-electric-300">verifiable by anyone.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-mist-300 sm:text-xl">
              Deposit collateral, borrow a protocol-native stablecoin, and manage
              risk through a modern interface built around transparent on-chain positions.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-electric-300 px-6 font-semibold text-ink-950 transition hover:bg-white"
                href="/dashboard"
              >
                Preview the dashboard
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 font-semibold text-white transition hover:border-electric-300/45 hover:bg-white/9"
                href="#how-it-works"
              >
                Explore the protocol
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 -z-10 rounded-full bg-electric-400/10 blur-3xl" />
            <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-ink-900/88 shadow-panel backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mist-300">Position engine</p>
                  <p className="mt-1 text-sm text-mist-300">Wallet not connected</p>
                </div>
                <span className="rounded-full border border-signal-green/20 bg-signal-green/8 px-3 py-1 text-xs font-medium text-signal-green">
                  Read-only
                </span>
              </div>
              <div className="grid gap-px bg-white/8 sm:grid-cols-3">
                <Metric label="Collateral" value="—" detail="ETH" />
                <Metric label="Debt" value="—" detail="AUSD" />
                <Metric label="Health" value="—" detail="Connect in Stage 4" />
              </div>
              <div className="p-6">
                <div className="mb-3 flex justify-between text-xs font-medium text-mist-300">
                  <span>Position risk</span>
                  <span>Awaiting on-chain data</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-electric-500 to-electric-300 opacity-45" />
                </div>
                <p className="mt-5 rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-sm leading-6 text-mist-300">
                  Stage 1 establishes the visual and engineering foundation. Wallet
                  reads and transaction controls are intentionally not simulated.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28" id="how-it-works">
        <Container>
          <SectionHeading
            description="Each step will expose the contract impact, position risk, wallet request and confirmed on-chain result."
            eyebrow="A clear financial loop"
            title="From collateral to credit—without giving up custody."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {flow.map(([number, title, description]) => (
              <article
                className="group rounded-3xl border border-white/9 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-electric-300/30 hover:bg-white/[0.055]"
                key={number}
              >
                <span className="font-mono text-sm text-electric-300">{number}</span>
                <h2 className="mt-12 text-2xl font-semibold tracking-tight text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-mist-300">{description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-white/8 bg-white/[0.025] py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionHeading
            description="The product preserves every source-project capability while replacing the tutorial UI with an original, accessible financial experience."
            eyebrow="Built for scrutiny"
            title="A protocol interface should explain risk, not hide it."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map(([title, description]) => (
              <article className="rounded-3xl border border-white/9 bg-ink-900/70 p-6" key={title}>
                <div className="mb-8 h-2 w-2 rounded-full bg-electric-300 shadow-[0_0_14px_#71e5ff]" />
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-mist-300">{description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}

