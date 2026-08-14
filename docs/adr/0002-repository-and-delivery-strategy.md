# ADR 0002: Stage-scoped repository and delivery strategy

- Status: Accepted
- Date: 2026-08-14

## Context

The implementation must preserve the source project's root protocol plus nested frontend structure while producing a clean GitHub history and reviewable pull requests.

## Decision

Use one pnpm workspace and lockfile, implement one approved stage at a time, and pause before each commit. Stage branches use `stage/<number>-<scope>`. Commits follow Conventional Commits and pull requests use a structured template with testing, security, gas and visual evidence.

## Consequences

- Each stage can be reviewed, reverted and explained independently.
- Root and frontend dependencies remain reproducible without hiding their separate responsibilities.
- Large mixed commits and documentation drift are easier to prevent.
- The final interview guide can cite a precise deployed tag instead of unfinished plans.
