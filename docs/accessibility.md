# Accessibility and responsive acceptance guide

Aegis Bank targets WCAG 2.2 AA interaction and contrast practices. This is an engineering target, not an accessibility certification. Re-run this guide whenever navigation, forms, transaction status, or financial cards change.

## Automated gates

Run:

```bash
pnpm --filter frontend lint
pnpm --filter frontend test
pnpm --filter frontend build
```

ESLint catches supported JSX semantics, Vitest covers navigation and domain behavior, and the production build catches App Router boundary errors. Stage 7 adds browser-level accessibility automation.

## Viewport matrix

Check the home, dashboard, deposit/withdraw, borrow, repay, liquidation, and not-found routes at:

| Viewport | Acceptance |
| --- | --- |
| 320 × 568 | No horizontal page overflow; compact brand and wallet controls remain operable |
| 375 × 812 | Forms, previews, status drawer, and mobile navigation fit without clipped values |
| 768 × 1024 | Tablet layouts retain readable spacing and logical source order |
| 1440 × 900 | Desktop navigation, two-column workspaces, and dashboard hierarchy remain balanced |

At 200% browser zoom, all actions must remain reachable and text must reflow without overlapping controls.

## Keyboard checks

1. Tab from the browser chrome and confirm the skip link appears and moves focus to the main content.
2. Open the mobile navigation with Enter or Space. Confirm `aria-expanded` changes and each route is reachable.
3. Press Escape while the menu is open. Confirm it closes and focus returns to the menu button.
4. Complete amount entry, maximum selection, collateral mode switching, liquidation acknowledgement, preflight review, edit, and status dismissal without a pointer.
5. Confirm every focused interactive element has a visible cyan outline and no keyboard trap occurs.

## Assistive-technology checks

- Each route has one descriptive `h1` and a unique document title.
- Desktop and mobile navigation have distinct accessible names; the current page is announced.
- Amount and borrower fields announce instructions and errors. Invalid fields expose `aria-invalid`.
- Wallet changes, read failures, transaction progress, confirmations, and errors are announced without moving focus unexpectedly.
- Position health exposes a named meter and visible text; safe, warning, and danger states never rely on color alone.
- External transaction links announce that they open a new tab.

## User-preference checks

- Enable reduced motion and confirm transforms and animations become effectively immediate.
- Enable increased contrast or Windows forced colors and confirm focus and control boundaries remain visible.
- Check light-sensitive use at minimum brightness; no flashing or looping animation is present.

Record browser, wallet, viewport, assistive technology, result, and any exception in the Stage 7 QA evidence.
