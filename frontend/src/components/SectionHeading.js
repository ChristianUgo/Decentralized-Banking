export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-electric-300">{eyebrow}</p>
      <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-pretty text-base leading-7 text-mist-300 sm:text-lg">{description}</p>
    </div>
  );
}

