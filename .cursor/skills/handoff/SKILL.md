---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up. Use when the user invokes /handoff, asks to hand off work, continue in a new session, or compact context for the next agent.
argument-hint: 'What will the next session be used for?'
disable-model-invocation: true
user-invocable: true
---

# Handoff

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS — not the current workspace.

On macOS/Linux, prefer `$TMPDIR` (fall back to `/tmp`). Use a clear filename, e.g. `$TMPDIR/scilent-x-handoff-<short-slug>.md`, and tell the user the absolute path when done.

Include a **Suggested skills** section that names skills from this repo the next agent should invoke (paths under `.cursor/skills/`). Prefer concrete triggers (`/animate`, `review-animations`, `/research`, etc.) over vague advice.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs, open PRs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, tokens, `.env` values, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## Suggested document shape

```markdown
# Handoff: <focus>

## Goal for next session

…

## Done so far

- …

## In progress / blocked

- …

## Artifacts (do not re-derive)

- path or URL

## Suggested skills

- `.cursor/skills/<name>/SKILL.md` — why

## First actions

1. … # ADHD-shaped: ≤5 numbered steps, each one bounded action; lead with the smallest doable now
```

## In this repo (scilent-x)

- Point at branch name, open PR URL (if any), and relevant `docs/` / `agents/` paths.
- Mention Changesets if the next session will touch versioned `packages/*` or user-facing code in
  `apps/web`; `apps/mobile` remains excluded.
- Do not commit the handoff into the workspace unless the user explicitly asks.
- Shape **First actions** (and any human-facing next steps) per
  `.cursor/skills/i-have-adhd/SKILL.md`: action first, numbered, cap at 5, no preamble.
  Suggest `/i-have-adhd` under Suggested skills when the next session is human-driven setup or
  debugging.
