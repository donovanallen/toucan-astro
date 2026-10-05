---
name: pr
description: Open a pull request for the current branch. Push first if needed.
disable-model-invocation: false
---

# PR

Open a pull request for the **current branch**. Push first if needed. Keep the title and body consistent, concise, and scannable.

## Task

1. Inspect branch state (run in parallel):
   - `git status`
   - `git diff` and `git diff --cached`
   - `git log --oneline -10` and `git diff $(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)..HEAD` (full branch commit range vs base)
   - Current branch: `git branch --show-current`
   - Tracking / ahead-behind: `git status -sb` (or `git rev-parse --abbrev-ref @{upstream}` when set)
2. **Preconditions**
   - Must not be on `main` (or the default base). If on `main`, stop and tell the user to use a feature branch (or `/go-main` if they intend to land without a PR).
   - Working tree should be clean enough to review. If there are uncommitted changes the user clearly wants included, run `/go` first (or ask). Do not leave half-committed work out of the PR silently.
   - Prefer recent quality signal (`/ready`); if lint/typecheck/test clearly haven't been run on this branch's packages, run them on affected filters before opening the PR.
3. **Push**: if the branch has no upstream or is ahead of remote, `git push -u origin HEAD` (or `git push`). Never force-push.
4. **Title** — one line, conventional-commit style matching repo history:
   - `type(scope): short imperative summary`
   - Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf` (pick one primary type).
   - Scope = package/area when clear (`ui`, `scilent-ui`, `web`, `social`, `db`, …); omit scope only when the change is truly cross-cutting.
   - Prefer the branch's overall intent over listing every commit. Keep under ~72 characters when possible.
5. **Body** — use `gh pr create` with a HEREDOC. Match `.github/PULL_REQUEST_TEMPLATE.md` (omit a section only when it truly does not apply; prefer a one-line "None" over deleting Changeset / Screenshots when those are N/A). Agent-authored PRs must start with the attribution line from root `AGENTS.md`; delete it only when the user authored the PR.

```markdown
> 🤖 Authored by: <agent-profile> (Hermes agent)

## What

- 1–3 short bullets: what changed and why (not a file list)

## Scope check

- File inventory vs the task card / requested scope (no swept work)

## Verification

- What was run (e.g. `pnpm test --filter @scilent-one/ui`, `pnpm typecheck --filter …`)
- Manual checks a reviewer should do (concrete steps, not "test everything")
- Note gaps if something could not be verified locally

## Changeset

- Link or name any new `.changeset/*.md` files and which packages/bumps they cover
- Or: `N/A — docs/tests/tooling only` / `N/A — apps/mobile only` (per @docs/RELEASE.md)

## Screenshots

- For user-visible UI: include before/after or key states (empty, filled, error, mobile if relevant)
- Otherwise: `N/A`
```

6. **Labels** — apply on create or update so reviewers and automation can triage quickly. Use only labels from the repo's current set:

   | Label           | When to apply                                                                                                                                                                |
   | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `feature`       | New user-facing or API behavior                                                                                                                                              |
   | `bugfix`        | Fixes incorrect behavior (non-urgent)                                                                                                                                        |
   | `hotfix`        | Urgent production fix; say why in What                                                                                                                                       |
   | `docs`          | Documentation-only (`docs/`, README, comments that are the change)                                                                                                           |
   | `ui`            | Visual/component work in `packages/ui`, `packages/scilent-ui`, or web UI                                                                                                     |
   | `mobile`        | Expo / React Native (`apps/mobile`)                                                                                                                                          |
   | `storybook`     | Storybook stories, a11y/visual tests, `.storybook/`                                                                                                                          |
   | `lint`          | ESLint, Prettier, formatting-only — no behavior change                                                                                                                       |
   | `framework`     | Core stack bumps or migrations (`next`, `react`, `typescript`, `turbo`, `prisma`, `better-auth`, …)                                                                          |
   | `major`         | Major version bumps or intentional breaking changes                                                                                                                          |
   | `dependencies`  | Dependency / lockfile updates (Renovate usually sets this; add on manual dep PRs)                                                                                            |
   | `build-tooling` | Turbo, Vite, Vitest, build configs, shared tooling under `packages/tooling`                                                                                                  |
   | `ci`            | GitHub Actions or CI workflow changes (`.github/workflows/`)                                                                                                                 |
   | `automerge`     | Low-risk, checks-green PRs safe to merge without review (patch deps, lint-only, docs-only). **Do not** add on feature, framework, major, or mobile PRs unless the user asked |

   **Do not apply** triage labels (`duplicate`, `invalid`, `question`) when opening a PR — those are for issue/PR hygiene later.

   **How to pick:** analyze the full branch diff vs base. Prefer **one primary type** (`feature`, `bugfix`, `hotfix`, or `docs`) plus **zero or more area/risk labels**. Example: UI bug → `bugfix`, `ui`. Expo SDK bump → `dependencies`, `mobile`, `major`. ESLint config only → `lint`, `build-tooling`.

   **CLI:** pass labels at create time, or sync on an existing PR:

   ```bash
   gh pr create --label "feature,ui" --title "…" --body "$(cat <<'EOF'
   …
   EOF
   )"

   gh pr edit --add-label "bugfix,ui"    # existing PR
   gh pr edit --remove-label "feature"   # replace wrong labels when updating
   ```

7. **Screenshots** (when the diff adds or meaningfully changes UI):
   - Prefer capturing from the running app (`pnpm dev`) via the browser tools: navigate to the relevant route, snapshot key states, and attach images to the PR body (upload via `gh` or embed markdown image URLs GitHub accepts).
   - If the server isn't running or auth/data blocks a useful capture, say so under Screenshots and list the states a human should capture instead — do not invent placeholders.
   - Skip screenshots for pure backend, schema-only, chore/deps, or non-visual refactors.
8. Base the PR on `main` unless the user specified another base. Set draft only if the user asked for a draft.
9. If a PR for this branch already exists, update it (`gh pr edit` / push) instead of opening a duplicate; print the existing URL. Reconcile labels with `gh pr edit --add-label` / `--remove-label` when the diff intent changed.

## Requirements

- Use the `gh` CLI for all GitHub PR operations.
- Never update git config; never force-push; never skip hooks.
- Do not open a PR with secrets (`.env`, credentials) in the diff — warn and stop.
- Keep the body concise: no commit-by-commit dump, no large pasted logs. Organize with the template headings above.
- Analyze **all** commits on the branch vs base when drafting What — not only the latest commit.
- Changeset reminder: if the branch touches versioned `packages/*` (except `packages/tooling`) or user-facing code in `apps/web` and there is no changeset, call that out under Changeset and recommend adding one before merge (see @docs/RELEASE.md). `apps/mobile` remains excluded. Do not block PR creation solely for a missing changeset unless the user asked to enforce it.

## Output

- PR URL
- Title used
- Labels applied (and brief rationale if non-obvious)
- Whether the branch was pushed
- Whether screenshots were included (or why not)
- One-line note if a changeset is still missing for versioned packages
