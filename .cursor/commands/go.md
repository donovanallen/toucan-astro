# Go

Commit with an appropriate message and push to the current branch. Add a changeset when required.

## Task

1. Inspect the branch and changes:
   - `git status`
   - `git diff` and `git diff --cached`
   - `git log -5 --oneline` for commit message style
   - Current branch: `git branch --show-current`
2. Ensure the working tree is ready. If there are unstaged changes the user likely wants committed, stage them. If quality is uncertain, run `/ready` steps first (lint, typecheck, test on affected packages).
3. **Changeset check** — if staged changes touch:
   - `packages/*` except `packages/tooling/*`, or
   - user-facing code in `apps/web/*`

   and no new `.changeset/*.md` is staged, run `pnpm changeset` interactively (or author the changeset file manually), then stage it. Skip only for intentionally internal-only work (docs-only, tests-only, tooling) per @docs/RELEASE.md.
   `apps/mobile/*` remains excluded from Changesets.

4. Stage all files that belong in this commit. Do not commit secrets (`.env`, credentials).
5. Draft a conventional commit message from the diff — focus on **why**, match repo style (e.g. `fix(scilent-ui): …`, `feat(social): …`). Use a HEREDOC for the commit message.
6. Commit (never use `--no-verify` unless the user explicitly asked).
7. Push to the **current branch**: `git push -u origin HEAD` if upstream is unset, otherwise `git push`.

## Requirements

- Never update git config.
- Never force-push.
- Never skip hooks unless the user explicitly requested it.
- Do not push to `main` — use `/go-main` for that.
- Only create commits when executing this command (user explicitly requested commit + push).

## Output

- Commit hash and message
- Whether a changeset was added
- Push result (branch, remote)
- Brief summary of what shipped
