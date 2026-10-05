---
name: resolving-merge-conflicts
description: Resolve an in-progress git merge or rebase conflict by recovering original intent, preserving both sides where possible, running project checks, and finishing the merge/rebase. Use when merge/rebase is conflicted, git reports unmerged paths, or the user invokes /resolving-merge-conflicts.
disable-model-invocation: true
user-invocable: true
---

# Resolving Merge Conflicts

Use when you need to resolve an in-progress git merge/rebase conflict.

1. **See the current state** of the merge/rebase. Check git history, and the conflicting files.

2. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

3. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, pick the one matching the merge's stated goal and note the trade-off. Do **not** invent new behaviour. Always resolve; never `--abort`.

4. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Fix anything the merge broke.

5. **Finish the merge/rebase.** Stage everything and commit. If rebasing, continue the rebase process until all commits are rebased.

## In this repo (scilent-x)

- Prefer scoped Turborepo checks from the repo root after resolving:
  - `pnpm typecheck --filter <affected…>`
  - `pnpm test --filter <affected…>`
  - `pnpm lint --filter <affected…>` or `pnpm fix` when format/lint drift is expected
- If the resolution touches versioned `packages/*` (except `packages/tooling`) or user-facing code in `apps/web`, ensure a changeset exists or run `pnpm changeset` before considering the merge done (`docs/RELEASE.md`). `apps/mobile` remains excluded. The `changeset-reminder` Cursor hook may nudge on commit.
- Follow existing conventional-commit style for the merge/continue commit.
- Do not force-push, hard-reset, or skip hooks unless the user explicitly asks.
- Generated paths (e.g. `packages/db/prisma/generated/**`) — regenerate via the relevant `db:*`/build script rather than hand-merging generated output when practical.
