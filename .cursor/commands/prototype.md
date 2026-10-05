# Prototype

Build genuinely divergent UI variants behind the visual picker and wait for the
user to choose a winner.

Follow `.cursor/skills/prototype/SKILL.md` end-to-end. Copy picker chrome from
`.cursor/skills/prototype/PICKER.md` verbatim. In this repo, put the harness at
`apps/web/src/app/prototypes/<slug>/` and do not import it into production code.
DialKit's dock is already mounted for that tree — use `useDialKit` when a variant
needs live number tuning; strip it on promote.
