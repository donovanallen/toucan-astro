# Prefer container queries

Enforce Tailwind container queries over viewport breakpoints for reusable
components.

Follow `.cursor/skills/prefer-container-queries/SKILL.md`. Prefer `@container` /
`@md:` (etc.) in `packages/ui` and `packages/scilent-ui`; keep viewport
breakpoints for page shells in `apps/web`. Pair layout verification with
`/responsiveness` when useful.
