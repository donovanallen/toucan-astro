# add-skill examples

## Example 1: Process skill + docs wiring

**Invoke:** `/add-skill` — "Add a skill for writing conventional commit messages that match this repo."

**Skill produced:** `.cursor/skills/commit-style/SKILL.md` with third-person description, `disable-model-invocation: true`, checklist for reading `git log` and drafting messages.

**Implementation:** Entry in `docs/AGENT_TOOLING.md` + optional `.cursor/commands/commit-style.md`. No app logic changes.

**PR body (abbreviated):**

```markdown
## Skills added

- **commit-style** — Draft conventional commits from the diff using this repo's message style. Use when the user asks for a commit message or invokes /commit-style.

### How they're used

- Trigger: `/commit-style` or "write the commit message"
- Files: `.cursor/skills/commit-style/SKILL.md`
- Implementation is docs/command wiring only

### Examples

- User: "commit this" → agent reads skill, inspects diff/log, proposes `fix(ui): …`

## Changes from skill(s)

- Documented the skill in agent tooling so agents can discover it
- Added a slash command stub pointing at the skill
```

## Example 1b: External process skill (ADHD output)

**Invoke:** `/add-skill https://www.skills.sh/ayghri/i-have-adhd/i-have-adhd`

**Skill produced:** `.cursor/skills/i-have-adhd/SKILL.md` (upstream MIT rules + repo adaptations).

**Implementation:** Always-apply rule `.cursor/rules/i-have-adhd.mdc`, slash command,
`AGENTS.md` / `AGENT_TOOLING.md` discovery, cross-links in `bro` / `handoff` / `wizard`, and
light ADHD-shaped edits to developer-facing setup docs.

**Expected agent behavior:** always-on via `.cursor/rules/i-have-adhd.mdc` — no slash required.
`/i-have-adhd` only deepens; "stop adhd mode" opts out for the session.

## Example 2: Low-touch high-impact (global motion)

**Invoke:** `/add-skill` — "Add a skill for easing-token usage, and tighten global transitions to use existing `--ease-*` tokens."

**Skill produced:** Guidance to prefer `packages/ui` motion tokens and reduced-motion.

**Implementation:** Small CSS updates in `packages/ui/src/globals.css` only — no route/feature changes. Changeset for `@scilent-one/ui`.

**Why allowed:** Global styling/animation improvement; low maintenance; does not change business logic.

## Example 3: Stop — would contradict app logic

**Invoke:** `/add-skill` — "Add a matching skill and change how Harmony scores users."

**Correct behavior:** Authoring a read-only review skill may be fine; changing scoring without explicit permission violates hard constraints. Ask for permission or ship skill + docs only.
