---
name: retro
description: Generate a creative, shareable retro of what shipped in a time window — features, fixes, package changesets, and tooling/CI wins — drawn from git, GitHub PRs/CI, and Changesets. Renders a Cursor Canvas as the deliverable. Configurable timeframe, scope, and developer. Use when the user asks for /retro, a weekly digest, ship recap, "what did we ship this week", a sprint/release retro, or a progress report for this repo.
disable-model-invocation: true
user-invocable: true
---

# Ship Retro

Turn raw engineering activity in **scilent-x** into a fun, accurate, digestible
recap. Celebrates shipped features _and_ under-the-hood work (packages,
changesets, CI, DX), and spotlights each developer's contributions.

The deliverable is a **Cursor Canvas** (source of truth). Read-only by default —
no external publishes.

## Inputs (all optional, sensible defaults)

| Input            | Flag                                                                     | Default                                           |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Timeframe        | `--since` / `--until` or `--preset this-week\|last-7-days\|last-14-days` | current week (Mon→now)                            |
| Developer filter | `--developer <name-or-email substring>`                                  | everyone                                          |
| Scope filter     | `--scope <path-prefix>` (repeatable, e.g. `packages/ui/`)                | all paths                                         |
| GitHub slug      | `--gh-repo <owner/name>`                                                 | inferred from `origin` (`donovanallen/scilent-x`) |

Ask only for inputs you can't infer. Defaults (current week, this repo, all
devs) are usually correct.

## Data sources (each degrades gracefully)

- **git** (always) — commits, authors, PR numbers, LOC, files, conventional-commit categories.
- **GitHub** via `gh` (optional) — merged PR titles/bodies, reviewers, open-PR readiness. Needs `gh auth status`.
- **Changesets** (always when present) — pending `.changeset/*.md` files plus changesets touched in the window (packages/apps, bump types, summaries). Mirrors what `docs/RELEASE.md` / `pnpm changeset` track; `apps/web` is versioned and `apps/mobile` is ignored.
- **CI** via GitHub Actions (optional) — Test / Release workflow conclusions and durations, with optional prior-window delta. Skip with `--skip ci` or `--skip compare`.
- **Cursor** via the Admin API (optional) — per-member usage. Needs `CURSOR_ADMIN_KEY`. Skip with `--skip cursor`.
- **Coming Soon** — open PRs classified by readiness (ready / in-review / changes-requested / draft).

Any missing/failed source is recorded in `digest.json → sources[]`; surface a
short "sources included/skipped" line rather than failing.

## Flags & example usages

```bash
SKILL=.cursor/skills/retro/scripts/collect-retro.mjs

# Default: current week (Mon→now), this repo, all creators
node $SKILL

# Last 7 / 14 days
node $SKILL --preset last-7-days
node $SKILL --preset last-14-days

# Explicit window
node $SKILL --since 2026-07-01 --until 2026-07-14

# One developer (git name or email substring)
node $SKILL --developer donovan

# Restrict to packages (repeatable)
node $SKILL --scope packages/ui/ --scope packages/scilent-ui/

# Fast run
node $SKILL --skip ci,cursor
```

## Workflow

```
- [ ] 1. Resolve inputs (timeframe, developer, scope)
- [ ] 2. Run collect-retro.mjs → .digest/digest.json
- [ ] 3. Write the Theme (1–2 sentence narrative of the week in product context)
- [ ] 4. (Optional) Capture feature visuals → .digest/assets/
- [ ] 5. Render the Cursor Canvas (source of truth)
- [ ] 6. In chat: 2–4 sentence summary + point at the canvas
```

### The Theme (top-line)

Every retro opens with a **Theme**: a 1–2 sentence narrative that frames _all_
the week's work in scilent-x product context — what the app moved toward and what
got safer/faster underneath (packages, auth, harmony, UI, etc.). Synthesize from
headliners + changesets + under-the-hood work. Plain-language and concrete.

### Progress metrics & deltas

When CI data is present (`digest.json → ci`):

- **Workflow runs** — Test / Release success vs failure counts.
- **Duration** (`ci.workflows[].timing`) — avg duration with delta vs the prior
  equal-length window when compare wasn't skipped. Prefix ▲ slower / ▼ faster.
- **Incidents (numbers only)** — hotfixes, broken `main` Test runs. Terse counts.

When changesets data is present (`digest.json → changesets`):

- **Pending** — unreleased bump summaries still sitting in `.changeset/`.
- **In window** — changesets added/updated this period (package → major|minor|patch).
- Frame package work as release readiness, not just commit volume. See
  `docs/RELEASE.md`.

### 1. Resolve inputs

Default to current week and this repo. Confirm only ambiguous choices.

### 2. Collect

```bash
node .cursor/skills/retro/scripts/collect-retro.mjs \
  --preset this-week --out .digest/digest.json
```

Never commit `.digest/` or print `CURSOR_ADMIN_KEY`. Pass the key via env only.

### 3. Visuals (optional, default = placeholders)

By default render image **slots** with a short caption; do not block on
screenshots. To wire real visuals, capture into `.digest/assets/` (reuse
`responsive-testing`) and point each card's image slot at the saved file.

### 4. Render the Canvas

Follow [reference/canvas-output.md](reference/canvas-output.md). Read
`~/.cursor/skills-cursor/canvas/SKILL.md` first. The canvas IS the deliverable —
in chat give a short summary + the canvas link, not the full tables.

## Principles

- Celebratory but **accurate** — every claim ties to a commit, PR, or changeset.
- **Every PR reference is a clickable link:**
  `https://github.com/<owner>/<repo>/pull/<n>`. Never print a bare `#980`.
- Give equal airtime to invisible wins: package releases/changesets, CI, test
  coverage, DX. Frame by _value_, not just the diff.
- Per-dev spotlight is recognition, not ranking — Cursor stats are context, never
  a leaderboard.
- This skill is **scoped to scilent-x**. Do not call Jira, Slack, or Confluence
  integrations.

## Related

- `canvas` — canvas file rules (`~/.cursor/skills-cursor/canvas/SKILL.md`).
- `docs/RELEASE.md` — Changesets flow for package versioning.
- `responsive-testing` — optional feature screenshots.
