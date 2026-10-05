---
name: add-skill
description: Author a new Cursor skill with create-skill, implement it in the codebase with a low-touch change, and open a PR that documents the skill and the implementation. Use when the user invokes /add-skill, asks to add/create a skill and apply it, or wants a skill shipped with working code changes.
disable-model-invocation: true
user-invocable: true
---

# Add Skill

Create a project skill **and** apply it in this repo, then open a PR that covers both.

This skill uses the **create-skill** authoring workflow (structure, frontmatter, progressive disclosure, concise instructions). If the create-skill skill is available in the session, read and follow it first. If it is not available, follow the condensed authoring rules below — they match create-skill's required shape.

## Hard constraints (from invoker)

Usage of the skill should not affect/contradict with any existing business/application logic, unless otherwise permitted by the invoker; implementation should always be rather simple but appropriate to the application/codebase or, if involves larger refactoring, be low-touch/low-maintenance and high impact (I'm thinking global styling/animation improvmeents, automated processes, etc).

Also:

- Prefer project skills under `.cursor/skills/<name>/` (shared with the repo).
- Do not invent parallel design systems, auth flows, data models, or API contracts.
- Prefer extending existing tokens, hooks, docs, or scripts over one-off feature branches of product logic.
- Stop and ask if the only way to "use" the skill would change product behavior the invoker did not approve.

## Workflow checklist

Copy and track:

```
Add-skill progress:
- [ ] Step 1: Discover (purpose, name, triggers, constraints)
- [ ] Step 2: Design (scope + safe implementation plan)
- [ ] Step 3: Author skill (create-skill)
- [ ] Step 4: Implement in codebase (simple / low-touch high-impact)
- [ ] Step 5: Verify
- [ ] Step 6: Document discovery (AGENT_TOOLING / AGENTS when useful)
- [ ] Step 7: Commit, push, open PR
```

### Step 1: Discover

Gather (AskQuestion if available, else ask inline):

1. **Purpose** — what task the skill teaches
2. **Name** — lowercase kebab-case, max 64 chars (e.g. `add-theme`, `responsive-testing`)
3. **Triggers** — when agents should load it (`/name`, phrases, file areas)
4. **Auto-invoke?** — default `disable-model-invocation: true` unless the user wants ambient use
5. **Implementation target** — what safe codebase change proves the skill is useful
6. **Permissions** — any allowed exceptions to the hard constraints above

Infer from conversation when clear; only ask for what is missing.

### Step 2: Design

Before writing files, decide:

| Decision        | Guidance                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Skill location  | `.cursor/skills/<name>/SKILL.md` (+ optional companions)                                                                                  |
| Companion files | Only if needed (`examples.md`, `reference.md`, `scripts/`)                                                                                |
| Implementation  | Prefer: docs wiring, global CSS/tokens/motion, Cursor hooks/scripts, thin registries. Avoid: domain/API/auth/DB rewrites unless permitted |
| Impact shape    | Small + appropriate, **or** larger but low-touch / low-maintenance / high-impact                                                          |

If no safe implementation exists without contradicting app logic, say so and either (a) ship skill + docs-only wiring with invoker approval, or (b) stop.

### Step 3: Author the skill (create-skill)

Create:

```
.cursor/skills/<name>/
├── SKILL.md           # required
├── examples.md        # optional
├── reference.md       # optional
└── scripts/           # optional
```

`SKILL.md` must have YAML frontmatter + body:

```markdown
---
name: <name>
description: <third-person WHAT + WHEN, max 1024 chars>
disable-model-invocation: true
---

# <Title>

## Instructions

...
```

Authoring rules (create-skill):

- Description in **third person**, includes WHAT and WHEN / trigger terms
- Body under **500 lines**; put detail in one-level-deep linked files
- Concise — only knowledge the agent would not already have
- Consistent terminology; no Windows paths; no time-bomb instructions
- Verbatim user copy stays verbatim when they supply exact wording
- Prefer checklist/workflow patterns for multi-step skills
- Match nearby skills in this repo (`add-theme`, `responsive-testing`, etc.)

Omit `disable-model-invocation` only when the user wants ambient auto-apply. Set `user-invocable: true` when the skill is meant to be run via `/name`.

### Step 4: Implement in the codebase

Apply the new skill with a change that demonstrates it without fighting existing product logic.

**Good (default):**

- Register/document the skill in `docs/AGENT_TOOLING.md` and, when top-level discovery matters, `AGENTS.md`
- Global styling / motion token improvements in `packages/ui` (extend existing `--ease-*` / duration tokens; respect reduced-motion)
- Thin registries (e.g. theme palette registration patterns like `add-theme`)
- Automated process helpers: Cursor hooks, bootstrap scripts, lint/format affordances
- Optional `.cursor/commands/<name>.md` that points at the skill when a slash command is useful

**Avoid unless permitted:**

- Changing auth, payments, matching, social graph, or Prisma schema "to showcase" the skill
- Parallel component libraries or competing token systems
- Broad refactors that raise maintenance cost without clear leverage

If the skill itself is process-only (like this one), implementation may be documentation + optional command wiring — still ship that, do not leave an orphan `SKILL.md`.

When touching versioned `packages/*` (except `packages/tooling`) or user-facing code in
`apps/web`, add a changeset per `docs/RELEASE.md`. `apps/mobile` remains excluded.

### Step 5: Verify

- Skill path exists; frontmatter `name` matches directory
- Description is third-person and trigger-rich
- Implementation does not contradict hard constraints
- Run scoped checks appropriate to the diff (`pnpm typecheck --filter …`, `pnpm lint --filter …`, `pnpm test --filter …`)
- Confirm file references from `SKILL.md` are one level deep and resolve

### Step 6: Document discovery

Update `docs/AGENT_TOOLING.md` with a short entry for the new skill (what / when). Add a one-line pointer under **Skills** in root `AGENTS.md` when the skill is broadly useful to agents on this repo.

### Step 7: Commit, push, open PR

1. Work on a feature branch (Cloud Agents: `cursor/<descriptive-name>-<suffix>` when that policy applies).
2. Commit skill files + implementation + docs together (conventional commits).
3. Push (`git push -u origin <branch>`).
4. Open or update a PR against `main` (Cloud Agents: `ManagePullRequest`; otherwise follow `.cursor/skills/pr/SKILL.md` / `/pr`).

#### Required PR body sections

Use this structure (plus any repo-standard sections such as Test plan / Changeset):

```markdown
## Skills added

Succinct summary of each new skill: name, purpose, when to invoke.

### How they're used

- Trigger(s): `/name`, phrases, or auto-apply rules
- Where files live: `.cursor/skills/<name>/…`
- How implementation relates to the skill

### Examples

- Example invoke + expected agent behavior
- Example of the codebase change the skill produced (or would produce)

## Changes from skill(s)

Succinct summary of application/codebase changes made by applying the skill(s) — not a raw file list; focus on user/agent-visible effect.
```

Keep the whole PR description scannable. No commit dump, no large logs.

## Anti-patterns

- Skill-only PR with zero wiring when a safe doc/command update was available
- "Demo" product features that rewrite business logic without permission
- Vague skill names (`helper`, `utils`) or vague descriptions ("helps with skills")
- Duplicating create-skill prose instead of following it
- Skipping the PR or omitting the Skills / Examples / Changes sections

## Additional resources

- Worked invoke examples: [examples.md](examples.md)
- Theme-oriented sibling skill: `.cursor/skills/add-theme/SKILL.md`
- Agent tooling map: `docs/AGENT_TOOLING.md`
- Release / changesets: `docs/RELEASE.md`
