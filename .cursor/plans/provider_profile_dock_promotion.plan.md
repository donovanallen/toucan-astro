# Provider Profile Dock Promotion

## Goal

Integrate the **Dock** variant of the provider-profile header prototype into
the production profile page, following repo conventions, then remove the
prototype slug `apps/web/src/app/prototypes/provider-profile/`. Dock won over
Byline and Rail after a `/polish` pass.

The prototype explored how a user's primary streaming provider (Spotify /
Apple Music / TIDAL) should surface on their profile header. Dock: a full-width
bar pinned to the bottom of the profile card showing provider identity (mark +
"PRIMARY MUSIC HOME" + name), a taste summary (top artists), and an expandable
tray with the provider snapshot + a "Music ID" card.

## Done so far

- Branch `chore/track-prototypes`, PR
  [#261](https://github.com/donovanallen/scilent-x/pull/261). Prototype at
  `apps/web/src/app/prototypes/provider-profile/`
  (URL `/prototypes/provider-profile?v=3`).
- Three variants behind a picker: Byline, Rail, **Dock** (winner).
- `variant-dock.tsx`, `variant-portal.tsx`, `variant-rail.tsx`, `shared.tsx`
  (provider data + shared subcomponents), `harness.tsx` (picker + variant
  switch), `proto.css` (all styles).
- `/polish` pass applied to Dock:
  1. Fixed harness hydration mismatch (`harness.tsx`): variant initializes to
     `0` and applies `?v=` in a post-mount effect instead of reading
     `window.location` during `useState` init.
  2. Dropped the dock trigger's chevron; "Explore/Hide" word + `aria-label`.
  3. Softened trigger border/gradient so it reads as one surface.
  4. Removed duplicated `.dock-portal-tray` CSS block + dead
     `.dock-action > svg` rules.
  5. Tray a11y: trigger `aria-controls="dock-portal-tray"`; tray
     `role="region"` + `aria-label`.
- Incidental on this branch: `/admin/prototypes` landing page
  (`apps/web/src/app/(authenticated)/admin/prototypes/`) that filesystem-scans
  `app/prototypes/*/page.tsx`. Not part of the Dock design.

## Key design decisions (don't re-litigate)

- **Dock over Byline/Rail**: provider always one glance away without consuming
  header real estate; expand is a single forgiving full-row target.
- **Word-only action** ("Explore"/"Hide"), no chevron.
- **Trigger reads as chrome, not content** — subordinate to the identity block.
- **Mobile**: center taste-summary hidden under 700px; tray stacks.
  Intentional.
- **Provider data** keyed by `ProviderId = 'spotify' | 'apple_music' | 'tidal'`
  with per-provider `brand`/`ink` (`providerData` in `shared.tsx`). Production
  must source from the real linked-provider record, not the hardcoded map.
- **"Music ID" dialog** (`MusicIdDialog` in `shared.tsx`) is a forward-looking
  expressive identity surface. Decide whether promotion includes it or just the
  dock trigger + tray; the tray's `PortalContents` references it via
  `onOpenMusicId`.

## Artifacts (do not re-derive)

- Prototype source:
  `apps/web/src/app/prototypes/provider-profile/{variant-dock,shared,harness,variant-portal,variant-rail}.tsx`,
  `proto.css`
- Picker chrome spec (verbatim): `.cursor/skills/prototype/PICKER.md`
- Prototype workflow + promote rules: `.cursor/skills/prototype/SKILL.md`
  (Hard Rule 5 = delete slug on promote)
- Polish checklist already applied: `.cursor/skills/polish/SKILL.md`
- Design tokens: `packages/ui/src/globals.css`
- Production profile target (likely):
  `apps/web/src/app/(authenticated)/profile/[username]/page.tsx` and
  `apps/web/src/app/(authenticated)/profile/page.tsx`
- Real provider data sources to investigate: `packages/db` (linked provider /
  account models), `@scilent-one/harmony-engine` if provider identity is domain
  logic

## Next actions

1. Open `apps/web/src/app/(authenticated)/profile/[username]/page.tsx` and the
   profile header component it renders; map where the dock bar belongs and how
   real provider data (`ProviderId`, brand, top artists) is fetched.
2. Decide the Music ID scope: include the dialog now, or ship dock+tray and
   stub `onOpenMusicId` behind a follow-up.
3. Run `/prototype` Phase 6 against the chosen surface; reuse the Dock markup
   and `proto.css` values, translating the hardcoded `providerData` to real
   data and the inline styles to `packages/ui` tokens where they already exist.
4. After integration, delete `apps/web/src/app/prototypes/provider-profile/`
   and add a Changeset (`pnpm changeset`) since this is user-facing
   `apps/web` code.

## Suggested skills

- `.cursor/skills/prototype/SKILL.md` — authoritative promote path (Phase 6)
  and the cleanup rule for deleting the slug.
- `.cursor/skills/vercel-react-best-practices/SKILL.md` — RSC-boundary
  serialization, avoid barrel imports, Suspense boundaries.
- `.cursor/skills/responsive-testing/SKILL.md` — viewport proof after
  promotion.
- `.cursor/skills/production-readiness/SKILL.md` — if promotion touches auth
  or user-facing profile routes before merge.
