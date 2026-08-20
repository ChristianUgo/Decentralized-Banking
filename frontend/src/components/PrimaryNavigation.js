"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { isNavigationItemActive, primaryNavigation } from "@/lib/navigation";

function NavigationLink({ active, href, label, mobile = false, onNavigate }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={
        mobile
          ? `flex min-h-12 items-center justify-between rounded-2xl px-4 text-base font-semibold transition ${
              active
                ? "bg-electric-300 text-ink-950"
                : "text-mist-200 hover:bg-white/7 hover:text-white"
            }`
          : `rounded-full px-3 py-2 text-sm transition ${
              active
                ? "bg-white/9 font-semibold text-white"
                : "text-mist-300 hover:bg-white/6 hover:text-white"
            }`
      }
      href={href}
      onClick={onNavigate}
    >
      {label}
      {mobile && <span aria-hidden="true">{active ? "Current" : "→"}</span>}
    </Link>
  );
}

export function PrimaryNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    globalThis.addEventListener("keydown", closeOnEscape);
    return () => globalThis.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
        {primaryNavigation.map((item) => (
          <NavigationLink {...item} active={isNavigationItemActive(pathname, item.href)} key={item.href} />
        ))}
      </nav>

      <button
        aria-controls="mobile-navigation"
        aria-expanded={open}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-white transition hover:border-electric-300/40 hover:bg-white/9 lg:hidden"
        onClick={() => setOpen((current) => !current)}
        ref={toggleRef}
        type="button"
      >
        <span aria-hidden="true" className="relative h-4 w-5">
          <span className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`absolute left-0 top-[7px] h-0.5 w-5 rounded bg-current transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 top-[14px] h-0.5 w-5 rounded bg-current transition ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </span>
      </button>

      <div
        className={`absolute inset-x-0 top-full border-b border-white/10 bg-ink-950/98 px-5 shadow-panel backdrop-blur-xl transition-[opacity,transform,visibility] duration-200 lg:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
        id="mobile-navigation"
      >
        <nav aria-label="Mobile primary" className="mx-auto grid max-w-7xl gap-1 py-4">
          {primaryNavigation.map((item) => (
            <NavigationLink {...item} active={isNavigationItemActive(pathname, item.href)} key={item.href} mobile onNavigate={close} />
          ))}
        </nav>
      </div>
    </>
  );
}
