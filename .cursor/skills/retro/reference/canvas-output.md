# Canvas output spec — ship retro

Render one `.canvas.tsx` at
`~/.cursor/projects/<workspace>/canvases/ship-retro.canvas.tsx`
(for this workspace:
`~/.cursor/projects/Users-donovanallen-Desktop-src-scilent-x/canvases/ship-retro.canvas.tsx`).

Import **only** from `cursor/canvas`. Embed all data inline (no fetch). Read
`~/.cursor/skills-cursor/canvas/SKILL.md` and the SDK `.d.ts` files for exact
exports before writing.

Tone: celebratory but flat/minimal — no gradients, emojis, box-shadows, or
rainbow color. Use accent color sparingly. Every chart titled + sourced.

## Section order

1. **Hero header + Theme**
   - Title ("Ship Retro"), the resolved date window, repo name.
   - Immediately below: the **Theme** — a 1–2 sentence narrative framing the
     whole week in scilent-x product context. Render as a prominent `Callout`
     (tone `info`) or lead `Text`, above the stats.

2. **Four headline stats** (`Stat` in a `Grid`)
   - Features shipped · PRs merged · Changesets (pending or in-window) · Net LOC
     (+adds/−dels).
   - Use work-item counts; don't invent story points.

3. **Headliners — feature showcase** (`Card` per feature, 1–2 col `Grid`)
   - One card per shipped feature (category `features`, plus high-value items).
   - Each card: feature name (from conventional-commit / PR title), a
     plain-language "why it matters" line, the PR `#` as a link, the author, and
     an **image slot** (placeholder caption now; real asset from `.digest/assets/`
     when captured).
   - Order by impact, not commit order.

4. **Package & Changesets** (`Callout` + compact `Table`)
   - Only when `digest.json → changesets` has pending or inWindow entries.
   - Pending: bump type + packages + summary (release readiness).
   - In window: changesets added/updated this period.
   - Frame as release surface area (`@scilent-one/*` and the private `web` app);
     note that `apps/mobile` is ignored by Changesets.

5. **Under the Hood — tooling / CI / SDLC** (`Callout` + compact `Table`)
   - Categories `tooling`, `tests`, `deps`. Frame each by value: faster CI,
     test coverage, dependency hygiene, agent/DX tooling.
   - Pull standouts into a short highlight list; keep the rest in a table.

6. **CI & Incidents** (`Grid` of `Stat`s + optional compact `Table`)
   - Only when `digest.json → ci` exists. Per tracked workflow (Test, Release):
     success/failure counts and avg duration. Show prior-window Δ when present.
   - Incidents (numbers only): hotfixes, broken `main` Test runs. `tone="danger"`
     / `"warning"` for non-zero.

7. **Dev Spotlight** (one block per contributor — mix `Card` + `Stat`)
   - Per dev: commits, PRs, net LOC, top areas touched (`apps/`, `packages/…`),
     notable ships.
   - When Cursor stats exist, add a small secondary row labeled _Cursor usage
     (context, not a ranking)_. Exclude bots (dependabot, renovate).

8. **By the Numbers** (charts — only when data exists)
   - `PieChart`: work-type split (features/fixes/tests/tooling/deps).
   - Title each with the specific metric; caption with source + window.
   - Skip raw activity-volume charts (commits per day / per contributor).

9. **Coming Soon** (forward-looking — concise themed bullet list, _not_ a table)
   - From `digest.json → comingSoon.openPRs`. Group into 3–5 product/eng themes
     (e.g. "Reviews & social", "UI / design system", "Platform & DX", "Harmony /
     matching"). Bullets: `What — [#PR](gh) · <readiness>`. Lead with readiness
     counts. Caption as readiness, not a commitment.

10. **Sources appendix** (`Code` or small `Table`)
    - Exact git range, `gh` repo slug, and which optional sources were included
      vs skipped (`digest.json → sources[]`).
    - No negative claims a source can't support.

## Rules

- Never render empty sections/charts — omit them.
- **Clickable refs:** render every PR `#n` as a markdown link inside `Text`
  (e.g. ``{`[#42](${GH}42)`}``). Build the link as a single template-string
  child so the parser catches it.
- Separate git/PR/changeset facts from inferred framing.
- Keep the first screen on outcomes (Theme + stats + headliners), not process notes.
