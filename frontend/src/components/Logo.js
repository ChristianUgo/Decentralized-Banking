import Link from "next/link";

export function Logo() {
  return (
    <Link aria-label="Aegis Bank home" className="inline-flex items-center gap-3" href="/">
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-electric-300/30 bg-electric-300/10 text-electric-300">
        <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
          <path d="M12 3 5.5 6v5.2c0 4.1 2.4 7.8 6.5 9.8 4.1-2 6.5-5.7 6.5-9.8V6L12 3Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="m9 12 2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
        </svg>
      </span>
      <span className="hidden text-sm font-semibold tracking-[0.08em] text-white min-[430px]:inline">AEGIS BANK</span>
    </Link>
  );
}
