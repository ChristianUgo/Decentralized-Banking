# Static-analysis policy

Stage 3 uses two complementary Solidity analyzers.

## Local gate: Solhint 6.2.4

Run `pnpm lint:contracts`. The configuration extends `solhint:recommended` and treats every remaining warning as a failure. It retains compiler-version, visibility, reentrancy, checked-call, custom-error, state-visibility, interface, and structural rules.

The following noisy recommendations are disabled deliberately:

- `use-natspec`: public behavior is documented in interfaces and protocol documentation; requiring author and per-field tags obscured security output.
- `gas-indexed-events`: numeric amounts are not search keys and indexing them would increase log cost.
- `gas-strict-inequalities`: financial boundary direction is selected for correctness, not changed for a heuristic gas suggestion.
- `immutable-vars-naming`: camel-case immutable module references match established Solidity/OpenZeppelin style.
- `ordering`: source order follows protocol action/read/internal groupings rather than the linter's generic layout.

The adversarial test receiver narrowly suppresses `no-complex-fallback` and `avoid-low-level-calls` because those constructs are the behavior under test. Production contracts receive no equivalent suppression.

## CI gate: Slither 0.11.6

The `Slither static analysis` GitHub Actions job compiles the exact lockfile and runs the pinned Slither release. Findings of medium severity or above fail the job. Dependencies and purpose-built adversarial test contracts are excluded so the report focuses on protocol-owned production code.

`LendingPool` uses five line-scoped `incorrect-equality` suppressions for reviewed zero-sentinel checks: a rounded zero liquidation quote, clearing the interest timestamp after full repayment, detecting an inactive accrual window, accepting zero rounded interest, and representing a debt-free account with maximal health. These comparisons do not use attacker-controlled balances as authorization conditions. The detector remains enabled everywhere else, and every future suppression requires a nearby protocol-specific justification.

Slither is not available in the Windows development environment, so Solhint is the reproducible local static gate and Slither is the independent Linux CI gate. A green Slither run is required before Stage 3 may be merged.

Static analysis does not establish safety or replace an independent audit.
