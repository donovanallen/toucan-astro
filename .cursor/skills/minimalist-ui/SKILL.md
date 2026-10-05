---
name: minimalist-ui
description: Audit and refine scilent-x web UI for utilitarian minimalism — consistency, balance, usability, flat surfaces, restrained motion, and token-first styling. Adapted from leonxlnx/taste-skill minimalist-ui. Use when the user invokes /minimalist-ui, asks for a UI consistency/balance/usability audit, or wants editorial flat polish without inventing a parallel design system.
disable-model-invocation: true
user-invocable: true
---

# Minimalist UI (scilent-x)

Premium utilitarian minimalism as an **audit and polish protocol** for this
monorepo. Upstream source:
[leonxlnx/taste-skill `minimalist-ui`](https://github.com/Leonxlnx/taste-skill/tree/main/skills/minimalist-skill).

This skill does **not** replace scilent-x branding. Map every recommendation onto
existing tokens in `packages/ui/src/globals.css` (fonts, `--shadow-*`, `--radius`,
`--ease-*` / `duration-*`, semantic colors, `[data-theme]` palettes).

## Hard constraints (repo)

- Prefer extending `packages/ui` / `packages/scilent-ui` over one-off page CSS.
- Do not invent parallel token systems, icon libraries, or auth/API/DB changes.
- Lucide remains the general icon set; `ProviderIcon` is for DSP brand marks only.
- Shadows `shadow-sm` / `shadow-md` / `shadow-lg` are already remapped to low-opacity
  tokens — treat **arbitrary** `shadow-[…]` / raw `box-shadow` as the real smell.
- Marketing landing may keep intentional atmosphere; product/admin chrome stays flat.
- Respect `prefers-reduced-motion` and existing motion utilities.

## Workflow

```
Minimalist-ui progress:
- [ ] 1. Scope (routes / packages / full web surface)
- [ ] 2. Run checklist (below) with ripgrep + visual pass
- [ ] 3. Rank CRITICAL / HIGH / MEDIUM
- [ ] 4. Ship only safe fixes (shared components, tokens, copy)
- [ ] 5. Verify (typecheck/lint/test scoped filters; optional GUI)
- [ ] 6. Record findings (PR body and/or docs/research note)
```

## Audit checklist

| #   | Check             | Pass criteria                                                                        |
| --- | ----------------- | ------------------------------------------------------------------------------------ |
| 1   | Fonts             | No Inter / Roboto / Open Sans; use Doto / Space Grotesk / Source Sans 3 / Space Mono |
| 2   | Shadows           | Prefer token utilities; no heavy arbitrary shadows; opacity stays subtle             |
| 3   | Color             | No bright primary section fills on product UI; brand accents via tokens              |
| 4   | Gradients / glass | No neon/glassmorphism on ops chrome; subtle navbar blur OK                           |
| 5   | Radius            | No `rounded-full` on large cards or primary buttons (badges/avatars OK)              |
| 6   | Borders           | Prefer `border-border` / semantic tokens over ad-hoc gray hex                        |
| 7   | Focus             | Every keyboard-focusable control has a visible `focus-visible` ring                  |
| 8   | Touch             | Primary controls meet `touch-target` / 44px on coarse pointers                       |
| 9   | Copy              | No emoji in shipped UI; no "Elevate / Seamless / Unleash / …" clichés                |
| 10  | Motion            | Use `duration-fast                                                                   | base | slow`+`--ease-*`; animate transform/opacity only |
| 11  | Tokens            | Prefer CSS vars (`--platform-*`, semantic colors) over stray hex                     |
| 12  | Balance           | One job per section; generous whitespace; avoid competing chrome                     |

Use the shared utilities when fixing focus/touch:

- `focus-ring` — keyboard-visible ring matching Button/Input
- `touch-target` / `touch-target-extended` — coarse-pointer hit areas

## Review output format

When auditing (not just implementing), report a markdown table:

| Severity | Issue | Location    | Fix |
| -------- | ----- | ----------- | --- |
| CRITICAL | …     | `path:line` | …   |

Then list **safe fixes shipped** vs **deferred** (needs product approval).

## Safe fix classes (default yes)

- Add/restore `focus-ring` on catalog cards, list rows, author links, menus
- Replace `hsl(var(--token))` misuse on oklch tokens
- Point arbitrary shadows at `shadow-sm` / `var(--shadow-*)`
- Unify platform brand washes to `--platform-*` CSS vars
- Strip AI clichés and production emojis
- Flatten admin/marketing-adjacent chrome that fights product UI
- Normalize motion classes to named duration/easing utilities

## Unsafe without explicit permission

- Replacing Lucide with Phosphor/Radix Icons globally
- Forcing warm-bone canvas or serif editorial headings over brand fonts
- Rewriting auth, matching, social graph, or Prisma schema "for taste"
- Broad marketing landing redesign beyond copy/token hygiene

## Related

- Upstream protocol details: [reference.md](reference.md)
- Worked audit patterns: [examples.md](examples.md)
- Stack with `/polish` for path completeness; conflicts: `.cursor/skills/polish/divergences.md`
- Sibling taste skills: `emil-design-eng`, `prefer-container-queries`, `responsive-testing`
- Tokens: `packages/ui/src/globals.css`
