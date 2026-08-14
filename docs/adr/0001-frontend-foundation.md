# ADR 0001: JavaScript App Router with project-owned Tailwind components

- Status: Accepted
- Date: 2026-08-14

## Context

The project requires the latest stable Next.js, JavaScript rather than TypeScript, vanilla Tailwind CSS and an original modern interface.

## Decision

Use the Next.js App Router under `frontend/src/app`, JavaScript/JSX source files, Tailwind CSS v4 utilities and components owned by this repository. Do not introduce a UI component framework.

## Consequences

- The application keeps a distinct visual identity and a small dependency surface.
- Runtime validation and focused tests must compensate for the absence of TypeScript.
- Accessibility behavior is the project's responsibility and is included in acceptance testing.
- Client components will be limited to wallet and interactive boundaries; public content stays server-rendered where possible.

