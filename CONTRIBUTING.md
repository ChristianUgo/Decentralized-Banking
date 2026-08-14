# Contributing

## Development flow

1. Start from an up-to-date `main` branch.
2. Create a stage-scoped branch such as `stage/02-protocol-core`.
3. Keep the change focused and add or update tests.
4. Run `pnpm check`.
5. Open a structured pull request using the repository template.

## Commit messages

Use Conventional Commits:

```text
<type>(<scope>): <imperative summary>
```

Preferred types are `feat`, `fix`, `test`, `docs`, `refactor`, `perf`, `chore` and `ci`.

Good examples:

```text
chore(repo): establish stage 1 foundation
feat(protocol): add collateral deposit accounting
test(liquidation): cover healthy position rejection
docs(security): record oracle trust assumptions
```

Avoid messages such as `update`, `changes`, `final`, `fix stuff` or descriptions that combine unrelated work.

## Pull requests

Every PR must explain:

- why the change is needed;
- what is inside and outside scope;
- how it was tested;
- security and gas implications;
- screenshots for visible UI changes;
- follow-up work and known limitations.

## Tests

Prefer short files that cover one behavior. Keep a test file near 200 lines or less when practical. If a test becomes difficult to scan, split it by action, invariant or failure mode.
