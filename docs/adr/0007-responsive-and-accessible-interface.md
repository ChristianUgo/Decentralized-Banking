# ADR 0007: Responsive and accessible transaction interface

## Status

Accepted for Stage 6.

## Context

The complete banking flow must remain understandable and operable from a narrow mobile viewport through a desktop dashboard. Wallet state, risk, preflight, signature, submission, and confirmation are material financial states; hiding them behind color, hover, or desktop-only navigation would make the interface unreliable for keyboard, touch, low-vision, and assistive-technology users.

## Decision

- Keep one semantic navigation model for desktop and mobile, with the current route exposed through `aria-current`.
- Use an explicit mobile menu button with expanded state, a named menu region, Escape-key dismissal, and touch targets of at least 44 CSS pixels.
- Preserve a skip link, visible global keyboard focus, logical heading order, labeled form controls, inline instructions, and programmatic error/status announcements.
- Present transaction progress with text as well as color. Submitted hashes identify new-tab behavior, and confirmed state is not announced before a successful receipt.
- Let financial values wrap instead of clipping them on narrow screens. Use responsive single-column layouts before introducing multi-column dashboard and review arrangements.
- Respect reduced-motion, increased-contrast, and forced-color preferences without introducing a component framework.
- Target WCAG 2.2 AA interaction and contrast practices, while making no certification or audit claim.

## Consequences

- Navigation owns a small client boundary because active-route and menu state depend on the browser pathname and keyboard events.
- The custom Tailwind system remains visually distinct and dependency-light, but accessibility requires continued regression testing as flows change.
- Stage 6 provides the responsive and semantic implementation plus a repeatable manual checklist. Automated end-to-end accessibility scanning and the public wallet/browser matrix remain Stage 7 release work.
- Accessibility improvements do not change contract authorization, transaction simulation, or protocol risk enforcement.
