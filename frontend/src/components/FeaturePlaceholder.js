import { Container } from "./Container";

export function FeaturePlaceholder({ eyebrow, title, description, items }) {
  return (
    <main id="main-content" className="min-h-[72vh] py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-ink-900/75 shadow-panel backdrop-blur-xl">
          <div className="border-b border-white/8 p-7 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-electric-300">{eyebrow}</p>
            <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-mist-300">{description}</p>
          </div>
          <div className="grid gap-px bg-white/8 md:grid-cols-3">
            {items.map((item, index) => (
              <div className="bg-ink-900 p-7 sm:p-8" key={item}>
                <span className="font-mono text-xs text-electric-300">0{index + 1}</span>
                <p className="mt-10 font-semibold text-white">{item}</p>
                <p className="mt-2 text-sm leading-6 text-mist-300">
                  Scheduled for the relevant implementation stage.
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}

