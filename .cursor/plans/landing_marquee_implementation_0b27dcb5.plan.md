---
name: landing-marquee-implementation
overview: 'Replace the current hero-only client landing page with the eight-section “Marquee” campaign page, reconciled to the canonical September 2026 design system. Keep all unsettled copy and URLs isolated in `content.ts`, with safe placeholders so implementation can proceed without content decisions.'
todos:
  - id: server-contract
    content: 'Replace the client monolith with a server compositor, typed content model, and copy-only content source'
    status: completed
  - id: static-sections
    content: Build the eight-section Campaign-register layout with canonical tokens and exact cut/grid rules
    status: completed
  - id: client-leaves
    content: Implement the accessible marquee and Canvas 2D halftone as the only client leaves
    status: completed
  - id: coverage-docs
    content: 'Update tests, user-flow docs, dependency state, and the required web changeset'
    status: completed
  - id: visual-verification
    content: 'Run automated checks and capture responsive, keyboard, reduced-motion, and fallback proof'
    status: completed
isProject: false
---

# Implement the Marquee landing page

Executable implementation plan for the Claude landing handoff ("The Marquee"), reconciled against current `main` design-system state after the brand-system alignment.

## Current shipped state

Marquee `/` was reverted (PR #273; inadvertent land through #259). `/` is again the
hero-only `'use client'` landing: `@paper-design/shaders-react` dithering,
`SpotlightWordmark` (Doto), Sign up / Log in CTAs, `SHOW_BELOW_FOLD = false`
(mock connect/composer remain in-file but unmounted). #258 stays the re-land path.
Living docs: [USER_FLOWS.md](../../docs/USER_FLOWS.md) Flow 1, [BRAND.md](../../docs/BRAND.md) §4,
[BETA_INCOMPLETE_FEATURES.md](../../docs/BETA_INCOMPLETE_FEATURES.md) (connect-demo row Missing / demo-only).

## Current baseline (as of `origin/main` when this plan was written)

- Route: `/` → [`apps/web/src/app/(unauthenticated)/page.tsx`](<apps/web/src/app/(unauthenticated)/page.tsx>) → [`LandingPage`](<apps/web/src/app/(unauthenticated)/landing/landing-page.tsx>)
- Landing is a single `'use client'` file (~900 lines) with WebGL `Dithering` background and `SHOW_BELOW_FOLD = false` (only nav + hero ship)
- Content: [`apps/web/src/app/(unauthenticated)/landing/content.ts`](<apps/web/src/app/(unauthenticated)/landing/content.ts>)
- Motion CSS: [`apps/web/src/app/(unauthenticated)/landing/landing.css`](<apps/web/src/app/(unauthenticated)/landing/landing.css>)
- Tests: [`webgl-support.test.ts`](<apps/web/src/app/(unauthenticated)/landing/webgl-support.test.ts>), [`session-eyebrow.test.ts`](<apps/web/src/app/(unauthenticated)/landing/session-eyebrow.test.ts>), e2e [`01-marketing.spec.ts`](apps/web/e2e/specs/unauthenticated/01-marketing.spec.ts)
- Design system: [`packages/ui/src/globals.css`](packages/ui/src/globals.css), narrative rules in [`docs/BRAND.md`](docs/BRAND.md)
- Logo: [`ScilentLogo`](apps/web/src/components/scilent-logo.tsx) lettermark only
- Fonts: Space Grotesk / Source Sans 3 / Space Mono / Doto via [`apps/web/src/lib/fonts.ts`](apps/web/src/lib/fonts.ts)

## Reconciliation decisions

- Treat [`packages/ui/src/globals.css`](packages/ui/src/globals.css) and [`docs/BRAND.md`](docs/BRAND.md) as canonical where the handoff is stale: use `--brand-accent`, the `--sand-*` ramp, `--brand-shear`, `--duration-*`, `--ease-*`, the 16px major-third type scale, and `font-heading` / `font-body` / `font-mono` / `font-signal`. Do **not** recreate the handoff’s `--bg`, `--rule`, `--dim`, or `--brand-sand` aliases.
- Keep the landing in the documented Campaign register: dark/black ground, sand accent, flat 1px grids, square marketing surfaces, halftone texture, and exactly three uses of the 35.75° cut. Shared app components may be reused only when their default radius/palette does not fight this register.
- Use Space Grotesk for the marquee and all word-based headings. Doto remains numeral-only except for the two wordmark exceptions already named in [`docs/BRAND.md`](docs/BRAND.md); do **not** extend that exception to the rotating verbs.
- Default unresolved behavior to `Request access → #access`, content-driven contact/social placeholders, and the existing `ScilentLogo` lettermark plus text label. Do not invent a wordmark, trademark symbol, social URL, or external form destination.
- Remove the current dormant fake demos and WebGL shader. `@paper-design/shaders-react` is landing-only today — remove it from [`apps/web/package.json`](apps/web/package.json) and regenerate the lockfile.

## Gaps / confusion for the implementer (non-blocking)

| Gap                                                                          | Decision in this plan                                                                                           |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| No approved wordmark SVG in repo                                             | Keep `ScilentLogo` lettermark + mono text label; track wordmark swap separately                                 |
| Request-access destination unset                                             | Primary CTA href = `#access` (in-page beta section) until product provides a form/mailto                        |
| Contact email / social URLs unset                                            | Placeholders only inside `LANDING_CONTENT`; omit empty social entries rather than fake links                    |
| Handoff stack says Next 14 / Space Grotesk / Source Sans / Space Mono / Doto | Repo is Next 16 + that exact font stack already — no font package changes needed                                |
| Handoff path `apps/web/src/app/(unauthenticated)/landing/`                   | Use the real path above (`(unauthenticated)/landing/`)                                                          |
| Handoff forbids `bg-accent` for sand                                         | Correct and still true: `--accent` is grayscale hover; use `--brand-accent` / `bg-brand-accent` / `text-sand-*` |
| Analytics events in handoff                                                  | Out of scope unless an analytics API already exists at execution time                                           |

## 1. Establish the server-first landing contract

- Replace the monolithic client implementation in [`landing-page.tsx`](<apps/web/src/app/(unauthenticated)/landing/landing-page.tsx>) with a **server** compositor that renders nav, the seven content sections, and footer in the handoff’s fixed order.
- Add [`landing.type.ts`](<apps/web/src/app/(unauthenticated)/landing/landing.type.ts>) with the `BUILD_STATUS` const map (`live` | `beta` | `soon`) and readonly interfaces for verbs, sources, features, audience tiles, beta status, navigation, and footer data.
- Rewrite [`content.ts`](<apps/web/src/app/(unauthenticated)/landing/content.ts>) as one `LANDING_CONTENT` object. Include every visible string and URL—including aria labels, footer/legal labels, source names, CTA labels, and temporary destinations—so copy can later change without component edits. Draft copy from the handoff is fine; Mo will replace strings later.
- Delete `SHOW_BELOW_FOLD`, session-dependent hero copy, fake review data, local platform badge, and mock connect/composer state. Preserve the existing signed-in `/ → /home` middleware redirect; the public page itself does not need session JS.
- Delete [`webgl-support.ts`](<apps/web/src/app/(unauthenticated)/landing/webgl-support.ts>) and its test once the shader is gone. Delete or rewrite [`session-eyebrow.test.ts`](<apps/web/src/app/(unauthenticated)/landing/session-eyebrow.test.ts>) if the eyebrow helper is removed.

### Target section order

0. Nav — lettermark, name label, Log in, Request access
1. Hero `#top` — halftone, kicker, marquee H1, rotating caption, 2 CTAs
2. What this is `#what` — H2 + 2 paragraphs, no visual
3. The merge `#converge` — SVG trace diagram + 4 source tiles
4. What you can do `#do` — 4 feature cards with mocks + “Next up” strip
5. Who it’s for `#who` — 3 audience tiles
6. Where the beta is `#access` — plain (Source Sans) status lists + CTA
7. Close — campaign closing line + CTAs + shear
8. Footer — mark, link columns, legal strip

## 2. Build the static campaign sections

Create the handoff component tree under [`components/`](<apps/web/src/app/(unauthenticated)/landing/components/>):

```
landing/
├── landing-page.tsx              # server compositor
├── content.ts
├── landing.type.ts
├── landing.css
└── components/
    ├── landing-nav.tsx
    ├── section-heading.tsx
    ├── status-badge.tsx
    ├── cta-button.tsx
    ├── merge-diagram.tsx
    ├── source-grid.tsx
    ├── feature-card.tsx
    ├── feature-mock/
    │   ├── mock-mix.tsx
    │   ├── mock-review.tsx
    │   ├── mock-insights.tsx
    │   └── mock-credits.tsx
    ├── next-up-strip.tsx
    ├── audience-grid.tsx
    ├── beta-status.tsx
    ├── closing-cta.tsx
    ├── landing-footer.tsx
    └── hero/
        ├── hero.tsx              # server shell
        ├── marquee-headline.tsx  # 'use client'
        ├── use-marquee.hook.ts
        ├── halftone-field.tsx    # 'use client'
        └── use-halftone.hook.ts
```

- Implement the hero server shell with a static canonical H1 sentence available before hydration (`Music lives here.`) and the interactive slot/client decoration mounted as enhancements.
- Move campaign styling into [`landing.css`](<apps/web/src/app/(unauthenticated)/landing/landing.css>): max-width ~1160px, gutter `clamp(20px,5vw,56px)`, section padding `clamp(72px,10vw,124px)`, campaign neutrals derived from semantic tokens or black/transparent composition, exact type roles from the handoff mapped onto existing font utilities, auto-fit grids with 1px parent-backed hairlines (`gap:1px; background: var(--border)`), square cells, artwork-only radii (`--artwork-radius-sm/lg`), horizontal diagram overflow, and mobile nav/footer behavior (`<640px`: Request access only in nav; Log in in footer).
- Use `--brand-shear` (35.75°) for the mock crop, merge traces, and closing shear—the only three cut appearances. Use platform metadata/tints only as ≤8px dots / ≤12% washes / 40% borders; never as text ink or large fills.
- Reuse `ScilentLogo`, `Link` / view-transition link, and shared focus/touch utilities (`touch-target`, focus ring via `--focus-ring`). Keep landing-specific CTA and badge variants local because the Campaign register requires square, sand-led treatments that shared rounded Product `Button`/`Badge` components do not provide.
- Status badge: `live` renders `null`; `beta`/`soon` are outline-only Space Mono labels using sand-600 / muted ink — never filled.

## 3. Add exactly two progressive-enhancement client leaves

### Marquee

- Add `marquee-headline.tsx` + `use-marquee.hook.ts`.
- Sequence `[0,1,0,2,0,3,0,4]` looping; index 0 dwell 4200ms; others 2600ms; verb crossfade 340ms opacity+translateY; caption 320ms opacity; slot width 380ms; easing `cubic-bezier(0.22, 1, 0.36, 1)` or `--ease-out` if visually equivalent — prefer brand `--ease-out` / `--duration-*` when close enough, otherwise document the one-off curve in `landing.css`.
- Pause on pointerenter/focus; resume on leave/blur; pause when tab hidden.
- A11y: stable `sr-only` H1 `Music lives here.`; visual parts `aria-hidden`; interactive verb is a `<button>` whose `aria-label` updates; after activation `scrollIntoView` then `.focus({ preventScroll: true })` on the target section (`tabIndex={-1}`).
- Reduced motion / no-JS: static resting verb only; slot is a `<span>` when JS disabled.

### Halftone

- Add `halftone-field.tsx` + `use-halftone.hook.ts`.
- Canvas 2D only. Ramp from sand tokens / hex equivalents of the handoff six-stop sand ramp. Batch 6 paths/frame, ~30fps, DPR cap 1.5, pointer lift only on fine pointers, left falloff under headline, skip low values, dual overlay gradients, `pointer-events: none` on overlays.
- Reduced motion: one static frame, no rAF. Touch: ambient only. Null context: hide canvas, keep gradient overlay. Cleanup on unmount / visibilitychange.

- Do **not** add section reveal animations; static screenshots must show all content.

## 4. Update coverage, docs, and release metadata

- Replace obsolete shader/session tests with pure Vitest coverage for marquee sequencing/timing decisions and halftone math/degraded-state decisions where logic can be extracted without a DOM environment.
- Expand [`apps/web/e2e/specs/unauthenticated/01-marketing.spec.ts`](apps/web/e2e/specs/unauthenticated/01-marketing.spec.ts) to assert one accessible H1, section order/IDs (`#top`, `#what`, `#converge`, `#do`, `#who`, `#access`), nav and CTA destinations (`/login`, `#access`), keyboard marquee activation/focus transfer, and absence of the removed fake connect widget. Keep signed-in middleware redirect tests unchanged. Note: CTAs change from Sign up/Log in → Request access/Log in — update assertions accordingly.
- Update Flow 1 in [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md) to describe the eight-section static marketing page, Canvas fallback, request-access placeholder, and removed fake demos.
- Add a **patch** changeset for `web` describing the user-visible landing redesign (required per [`docs/RELEASE.md`](docs/RELEASE.md) / Changesets). Avoid package changes unless the implementation exposes a genuinely reusable primitive.

## 5. Verify the complete visual and interaction contract

- Run formatting/lint, typecheck, focused Vitest, and the marketing Playwright spec for `web`; then run a production `web` build to catch RSC/client-boundary and bundle errors.
- Manually inspect `/` at desktop, tablet, 375px mobile, and below 360px. Verify section rhythm, grid collapse, diagram horizontal scrolling, H1 wrapping, 44px targets, no horizontal page overflow, and the nav’s `<640px` behavior.
- Test keyboard-only navigation, 200% zoom, reduced motion, a coarse/touch pointer profile, Canvas disabled/failure fallback, and JS disabled. Confirm every section remains readable and the resting hero is `Music lives here.`
- Capture desktop and mobile full-page screenshots plus a short recording of marquee activation, focus transfer, and pointer-reactive halftone behavior. Attach these artifacts to the implementation PR.

## Implementation order for the next agent

1. Branch from latest `main`; pull brand tokens already on main (no need to re-land brand-system work).
2. Land the typed content model + empty section shells with correct IDs/order (copy can be draft).
3. Style layout/grids/tokens in `landing.css` against Campaign register rules.
4. Implement merge diagram + feature mocks (static).
5. Implement marquee client leaf + tests.
6. Implement halftone client leaf + tests.
7. Wire CTAs/nav/footer placeholders; remove shader dependency.
8. Update e2e + `USER_FLOWS.md` + changeset.
9. Visual QA + screenshots; open/update implementation PR with labels `feature`, `ui`.

## Done when

- `/` renders all eight sections without `SHOW_BELOW_FOLD`.
- Only two `'use client'` modules under landing (`marquee-headline`, `halftone-field`).
- No `@paper-design/shaders-react` dependency.
- Copy edits require touching only `content.ts`.
- Marketing e2e green; focused Vitest green; production `web` build green.
- Campaign register rules held: sand accent only via brand tokens, square marketing surfaces, three cuts, Doto numerals-only (except existing logo exceptions).
