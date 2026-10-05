# Upstream minimalist-ui protocol (reference)

Condensed from
[Leonxlnx/taste-skill `skills/minimalist-skill/SKILL.md`](https://github.com/Leonxlnx/taste-skill/blob/main/skills/minimalist-skill/SKILL.md).
Use this for greenfield comps or marketing experiments. For production scilent-x
UI, prefer the adapted rules in `SKILL.md` and map onto existing tokens.

## Absolute negative constraints

- No Inter / Roboto / Open Sans
- No Lucide / Feather / Heroicons as the _preferred_ system (upstream; scilent-x keeps Lucide)
- No heavy Tailwind drop shadows (`shadow-xl` etc.) — ultra-diffuse only
- No bright primary-colored hero sections
- No gradients, neon, or glassmorphism beyond subtle navbar blurs
- No `rounded-full` on large containers, cards, or primary buttons
- No emojis in UI copy or alt text
- No "John Doe" / "Acme" / "Lorem Ipsum" placeholders
- No AI clichés: Elevate, Seamless, Unleash, Next-Gen, Game-changer, Delve

## Typography (upstream targets)

- Body/UI: geometric sans (`Geist Sans`, `SF Pro`, …)
- Editorial headings: serif with tight tracking (`-0.02em`…`-0.04em`)
- Mono: Geist Mono / SF Mono / JetBrains Mono
- Body ink: off-black (`#111` / `#2F3437`), line-height ~1.6; secondary `#787774`

**scilent-x map:** Doto (display) · Space Grotesk · Source Sans 3 · Space Mono.
Do not swap these for upstream font names without an explicit brand decision.

## Color (upstream)

- Canvas: `#FFFFFF` / warm bone `#F7F6F3`
- Borders: `#EAEAEA` or `rgba(0,0,0,0.06)`
- Pastel accents only for tags/status

**scilent-x map:** `--background`, `--border`, `--muted*`, `--brand-*`,
`--platform-*`, and `[data-theme]` palettes.

## Components (upstream)

- Bento grids: 1px border, radius ≤12px, generous padding
- Primary CTA: solid near-black, radius 4–6px, no box-shadow; `:active` scale 0.98
- Badges: pills OK at `text-xs` uppercase
- Accordions: divider-only, no boxed chrome
- `<kbd>`: 1px border, muted fill, mono

## Motion (upstream)

- Scroll entry: `translateY(12px)` + opacity over 600ms, ease `cubic-bezier(0.16,1,0.3,1)`
- Hover lift: shadow to `0 2px 8px rgba(0,0,0,0.04)` over 200ms
- Animate only `transform` / `opacity`

**scilent-x map:** `duration-base` / `duration-fast`, `--ease-out`,
`animate-fade-in`, and global reduced-motion clamps in `globals.css`.
