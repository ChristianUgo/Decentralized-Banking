import { Container } from "@/components/Container";

export function ActionLayout({ aside, children, description, eyebrow, title }) {
  return (
    <main id="main-content" className="min-h-[72vh] py-10 sm:py-16">
      <Container>
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-300">{eyebrow}</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-mist-300 sm:text-lg">{description}</p>
        </div>
        <div className="mt-10 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(19rem,0.72fr)]">
          <div className="min-w-0">{children}</div>
          <aside className="min-w-0 space-y-5">{aside}</aside>
        </div>
      </Container>
    </main>
  );
}
