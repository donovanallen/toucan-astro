# Go Main

Commit and push directly to `main`. Use only when bypassing a feature branch / PR is intentional.

## Task

1. **Confirm intent** — this pushes straight to `main`. If the user is on a feature branch with unrelated history, stop and ask whether to merge/rebase onto `main` first or checkout `main` with only the intended changes.
2. Inspect state:
   - `git status`
   - `git diff` and `git diff --cached`
   - `git log -5 --oneline`
   - Current branch: `git branch --show-current`
3. Sync `main`:
   - `git fetch origin main`
   - If not on `main`: checkout `main` and `git pull origin main` (or rebase/merge the prepared commits — prefer the path that preserves the user's intended diff with minimal surprise)
   - If already on `main`: `git pull origin main`
4. Ensure the working tree is ready. Run lint/typecheck/test on affected packages if not recently verified (`/ready` steps).
5. **Changeset check** — same rules as `/go`: versioned package/app changes need a `.changeset/*.md` unless intentionally excluded. Run `pnpm changeset` and stage it when required (see @docs/RELEASE.md).
6. Stage all files for this commit. Do not commit secrets.
7. Draft a conventional commit message from the diff. Commit with a HEREDOC message.
8. Push to `main`: `git push origin main`.

## Requirements

- Never update git config.
- Never force-push to `main`.
- Never skip hooks unless the user explicitly requested it.
- Warn in the output that direct-to-main skips PR review.
- If push is rejected (non-fast-forward), pull/rebase and retry — do not force-push.

## Output

- Whether you were already on `main` or switched
- Commit hash and message
- Whether a changeset was added
- Push result
- Reminder that this landed on `main` without a PR
