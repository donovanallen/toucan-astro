# Ready

Lint and test unstaged changes. Fix what you can; do not stage or commit.

## Task

1. Inspect unstaged work:
   - `git status`
   - `git diff` (and `git diff --cached` if anything is staged — note it but focus on unstaged)
2. Map changed paths to affected workspace packages (`apps/*`, `packages/*`).
3. Run quality checks from the repo root, scoped when possible:
   - `pnpm lint --filter <affected>` (or `pnpm lint` if many packages / unclear scope)
   - `pnpm typecheck --filter <affected>` (or `pnpm typecheck`)
   - `pnpm test --filter <affected>` (or `pnpm test`)
4. Fix failures in the working tree. Prefer minimal, focused diffs. Re-run failed commands until they pass.
5. Use `pnpm fix --filter <affected>` for auto-fixable lint/format/type issues when appropriate.

## Requirements

- Work only on unstaged (and newly fixed) changes unless the user explicitly included staged files.
- Do not stage, commit, push, or run `pnpm changeset`.
- Do not suppress errors with `@ts-ignore`, eslint-disable, or skipping tests unless the user allows it.
- Follow conventions in @AGENTS.md.

## Output

Report:

- Files/packages touched
- Commands run and final pass/fail status
- Fixes applied (brief)
- Anything still blocking commit (if any)
