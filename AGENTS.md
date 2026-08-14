# Project working agreement

## Product contract

- Preserve the implementation plan's complete decentralized-banking feature set.
- Build in numbered stages and stop for review before each stage commit.
- Never describe tutorial code as audited or safe for real-value deployment.

## Code constraints

- Frontend code is JavaScript/JSX only. Do not add TypeScript, `.ts`, `.tsx`, or `tsconfig.json`.
- Use Next.js App Router under `frontend/src/app`.
- Use Tailwind CSS utilities and project-owned components only. Do not add a UI component framework.
- Keep contract responsibilities separated under `contracts/` and interfaces under `contracts/interfaces/`.
- Keep individual tests focused and preferably below 200 lines. Split by behavior, not by arbitrary line count.

## Quality gates

- Run `pnpm check` before proposing a commit.
- Include tests for behavior changes and document security or gas implications.
- Keep commits stage-scoped and use Conventional Commit messages.
- Do not commit secrets, generated contract artifacts, dependency folders, or local chain state.
