---
name: delight
description: Add moments of joy, personality, and unexpected polish that make interfaces memorable. Elevates functional UI to delightful. Use when the user asks to add polish, personality, micro-interactions, delight, or make an interface feel fun or memorable, or invokes /delight. Adapted from pbakaus/impeccable delight for scilent-x.
disable-model-invocation: true
user-invocable: true
---

# Delight

Identify opportunities to add moments of joy, personality, and unexpected polish
that transform functional interfaces into delightful experiences — without
blocking tasks or fighting the existing design system.

Upstream inspiration:
[pbakaus/impeccable · delight](https://www.skills.sh/pbakaus/impeccable/delight).

## Preparation (scilent-x)

There is no `/impeccable` context pack in this repo. Before changing UI:

1. Infer brand from existing surfaces (`apps/web` landing, auth, `packages/ui`
   tokens; see `docs/BRAND.md`). Default personality: **monochrome + sand,
   warm music culture** — mono labels, display wordmarks, sand accent
   (`--brand-accent`, `#F9D3B4` on dark marketing surfaces), restrained copy.
   Prefer **subtle sophistication** over whimsy or meme humor.
2. Load sibling craft skills when motion is involved: `emil-design-eng`,
   `animate` (+ `RECIPES.md`). Extend `--ease-*` / `duration-*` in
   `packages/ui/src/globals.css`; respect `prefers-reduced-motion`.
3. Confirm domain fit (banking ≠ gaming). Music social here can be warm and a
   little playful in empty/success/marketing moments, never cute during auth
   failures that block access.
4. If brand tone or audience is unclear from the codebase, ask once — do not
   invent a parallel personality system.

**CRITICAL**: Delight enhances usability. If users notice the delight more than
accomplishing their goal, pull back.

## Assess opportunities

Natural moments (enhance, don't invent product features):

| Moment        | Examples in this app                           |
| ------------- | ---------------------------------------------- |
| Success       | Review posted, account created, service linked |
| Empty / first | Landing hero, empty feed, onboarding           |
| Loading       | Auth submit, catalog sync                      |
| Interactions  | CTA hover/press, logo, focus rings             |
| Errors        | Soften copy; keep actionable                   |
| Discovery     | Cursor spotlight, console note, time-of-day    |

Strategy for scilent-x: **subtle sophistication** + occasional **helpful
surprises** (time-aware status, discovery hover). Skip sound unless explicitly
requested. Skip confetti on routine auth.

## Principles

### Amplifies, never blocks

- Moments under ~1s; never delay submit/navigation for animation
- Skippable or ambient; respect task focus on login/signup
- Reduced-motion: static fallbacks, no obligatory loops

### Surprise and discovery

- Hide small details (cursor reveal, logo hover) — don't announce them
- Don't make every control delightful; special moments stay special

### Appropriate to context

- Celebrate success; empathize on errors (warm, not jokey when locked out)
- Match existing typography/motion language — no new illustration system for a
  one-off pass

### Compound over time

- Prefer ambient variation (time of day, hover) over one-shot gags that stale

## Techniques (prefer existing tokens)

### Micro-interactions

- Buttons: `active:scale-[0.98]`, short hover lift via `transform` only; use
  `duration-fast` / `ease-out`
- Entrances: opacity + small translate/scale (≥0.97); reuse patterns like
  `landing-rise` / `landing-settle` rather than new libraries
- Forms: transition border/ring on focus; clear loading label on submit
  ("Signing in…") — product-specific, never AI-slop ("Herding pixels")

### Personality in copy

Warm and specific to music listening/reviews. Examples of tone:

```
Landing eyebrow: music lives here (time-aware variants TBD — see sessionEyebrow TODO)
Login description: Sign in to pick up where you left the catalog.
Auth error fallback: That email or password didn't match. Try again?
```

Banks shouldn't be wacky; neither should a failed login. Marketing can breathe.

### Visual / ambient

- Prefer existing shader/spotlight/marquee before adding particles
- Background atmosphere already on landing — tune, don't replace
- Easter eggs: quiet `console` note, title/tooltip discovery — never Konami
  themes that fight the theme picker

### NEVER

- Delay core functionality for delight
- Force unskippable celebrations
- Use delight to hide poor UX
- Overdo it; ignore a11y; sacrifice performance
- Change auth, matching, payments, or Prisma "for personality"
- Invent parallel motion/token systems

## Workflow checklist

```
Delight progress:
- [ ] Step 1: Read brand/context from existing UI + tokens
- [ ] Step 2: List 3–7 opportunities (table: moment → change → risk)
- [ ] Step 3: Implement only transform/opacity/copy/CSS token-aligned polish
- [ ] Step 4: Reduced-motion + keyboard/focus sanity
- [ ] Step 5: Verify (scoped lint/typecheck/test; manual hover/press if UI)
```

## Verify

- Still pleasant on the 100th visit (no sticky modal delight)
- Does not block submit, focus, or screen readers
- No jank; shaders/loops gated by WebGL + reduced-motion where applicable
- Matches elegant music brand — not generic "AI playful"

## Companion files

- Worked scilent-x examples: [examples.md](examples.md)
- Motion construction: `.cursor/skills/animate/SKILL.md`
- Agent tooling map: `docs/AGENT_TOOLING.md`
