---
name: Private Beta Requests
overview: Replace public signup CTAs with a dedicated private-beta request flow that validates and stores submissions, while preserving login for existing beta users and the invitation-only signup route. The experience should feel calm, deliberate, accessible, and consistent with the Scilent-X brand system.
todos:
  - id: persist-requests
    content: Add the Prisma enums, request model, migration, and regenerate the client.
    status: done
  - id: request-action
    content: Implement shared options and the validated, duplicate-safe server action.
    status: done
  - id: request-form
    content: Build the branded request-access page, accessible form states, and login escape hatch.
    status: done
  - id: replace-ctas
    content: Point all landing signup CTAs to /request-access while preserving login and invitation-only signup.
    status: done
  - id: verify-release
    content: Add focused tests, run scoped checks, and create the required changeset.
    status: done
isProject: false
---

# Private Beta Access Requests

## Outcome

Visitors to the public landing page can request access to the private beta without creating an account. Existing beta testers retain a clear login path, and `/signup` remains available only for invitation- or admin-driven onboarding.

## Experience principles

- Keep the flow short: name, email, user type, streaming providers, submit.
- Use quiet, specific copy rather than hype. Primary CTA: **Request access**. Supporting copy: **Tell us a little about how you listen, curate, or release music. We’ll follow up if there’s a fit for the private beta.**
- Never reveal whether an email already exists or expose database state. A valid new or repeated request should end in the same confirmation state.
- Preserve entered values after recoverable validation or server errors. Disable repeated submission only while the current request is pending.
- Reuse existing UI primitives and runtime tokens; do not create a parallel visual language for this page.

## 1. Persist access requests

- Update [`packages/db/prisma/schema.prisma`](packages/db/prisma/schema.prisma) with:
  - `UserType`: `LISTENER`, `CURATOR`, `ARTIST`, `LABEL_REPRESENTATIVE`, `OTHER`.
  - `BetaRequestStatus`: `PENDING`, `INVITED`, `REJECTED`.
  - `BetaRequest`: string id following the repository’s current ID convention, normalized unique email, trimmed name, `userType`, `providers String[]`, status defaulting to `PENDING`, `createdAt`, and `updatedAt`.
- Add an email lookup index only if it is not redundant with the generated unique index for the chosen database/schema convention.
- Add the matching PostgreSQL migration under [`packages/db/prisma/migrations/`](packages/db/prisma/migrations/) and regenerate the Prisma client.
- Implement duplicate handling as an atomic upsert keyed by normalized email:
  - A repeated `PENDING` request refreshes the submitted profile fields and timestamp without creating another row.
  - A repeated `INVITED` or `REJECTED` request must not silently reset moderation status; return the same neutral success response while preserving that status.
  - Normalize with `trim().toLowerCase()` before persistence so case and surrounding whitespace cannot create duplicates.

## 2. Add shared request options and server action

- Create a small shared request-access options module for the form and action. Keep canonical values separate from display labels.
- Include Spotify, Apple Music, TIDAL, YouTube Music, Deezer, Amazon Music, SoundCloud, Bandcamp, and Qobuz. Deduplicate provider values before persistence.
- Create [`apps/web/src/app/(unauthenticated)/request-access/actions.ts`](<apps/web/src/app/(unauthenticated)/request-access/actions.ts>) as a server action using Zod to:
  - Trim and bound name length.
  - Normalize and validate email.
  - Accept only known user-type and provider values.
  - Reject malformed or unexpectedly large submissions before any database write.
- Return a narrow discriminated result such as field errors, a form-level error, or success. Do not return Prisma errors, row identifiers, moderation status, or duplicate-email details.
- Convert expected validation and uniqueness races into typed results. Log unexpected failures through the existing server logger and show neutral recovery copy: **We couldn’t send your request. Try again in a moment.**

## 3. Build the unauthenticated request page

- Add [`apps/web/src/app/(unauthenticated)/request-access/page.tsx`](<apps/web/src/app/(unauthenticated)/request-access/page.tsx>) and [`apps/web/src/app/(unauthenticated)/request-access/request-access-form.tsx`](<apps/web/src/app/(unauthenticated)/request-access/request-access-form.tsx>).
- Follow existing auth-page and shared UI patterns for name and email inputs, an accessible user-type choice, provider checkboxes or multi-select, and pending/error/success states.
- Keep the page focused: one clear heading, concise context, the form, and **Already have access? Log in**.
- Success copy: **Request received** and **Thanks — we’ll review your request and email you if a private-beta place opens up.** Do not promise acceptance or a response date.
- Add a subtle sand-accent completion detail, such as a compact check mark and **You’re on the list**, without confetti, sound, or unrelated motion.

## 4. Accessibility and interaction requirements

- Associate every control with a visible label and useful description. Mark required fields in text, not color alone.
- Apply `aria-invalid` and `aria-describedby` to invalid controls; place field errors next to their controls.
- Put asynchronous form-level status in an `aria-live="polite"` region. Move focus to the success heading after success and to a form-error summary after an unexpected failure.
- Maintain logical keyboard order, visible token-based focus rings, and native keyboard behavior for grouped controls.
- Ensure interactive targets are at least 44×44 CSS pixels on touch layouts.
- Use sufficient contrast across monochrome surfaces and sand accents. Do not use placeholder text as a label.
- Pending feedback must include text such as **Sending request…**; animation cannot be the only indicator.

## 5. Motion and delight pass

Apply Emil Kowalski’s four gates before adding each animation:

1. **Frequency:** High-frequency controls get only near-instant press/focus feedback. Reserve the larger motion budget for the one-time success transition.
2. **Purpose:** Motion may clarify hierarchy, control response, validation, pending state, or the transition from form to confirmation. Remove motion that is merely decorative.
3. **Speed:** Keep press feedback within 100–160ms, small state transitions within 150–250ms, and routine UI motion below 300ms.
4. **Function:** Animate only composite-friendly `opacity` and `transform`; avoid dimensions, position, blur, and other layout/paint-heavy properties.

Implementation guidance:

- Use `--duration-instant` (100ms), `--duration-fast` (150ms), `--duration-base` (220ms), `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`), and `--ease-in-out` (`cubic-bezier(0.65, 0, 0.35, 1)`).
- Button press: scale no smaller than `0.97`, returning to `1` over the instant/fast duration. Do not apply hover transforms on touch-only interactions.
- Validation: reveal messages with a short opacity transition and, if useful, only a few pixels of vertical translation. Keep controls stationary to avoid disorienting layout shifts.
- Pending: preserve button width and replace or accompany its label with restrained progress feedback. Animate a wrapper rather than an SVG directly if a spinner is used.
- Success: crossfade form and confirmation with opacity plus restrained `0.97 → 1` scale or small vertical translation over `--duration-base` and `--ease-out`. Do not replay it.
- Under `prefers-reduced-motion: reduce`, remove transforms and nonessential transitions while preserving immediate state changes.

## 6. Match the Scilent-X visual system

- Follow [`docs/BRAND.md`](docs/BRAND.md) and runtime values in [`packages/ui/src/globals.css`](packages/ui/src/globals.css).
- Use monochrome base surfaces, existing typography and spacing, and the established sand accent (`--sand-600` on light surfaces or `--sand-200` where the dark theme requires it).
- Prefer one calm content column and clear spacing over extra cards, gradients, glow, glass effects, or ornamental backgrounds.
- Use sentence-case microcopy. Avoid startup clichés, false scarcity, countdowns, or guaranteed invitation language.
- Keep the login link visually secondary but easy to find.

## 7. Redirect public landing conversion points

- In [`apps/web/src/app/(unauthenticated)/landing/landing-page.tsx`](<apps/web/src/app/(unauthenticated)/landing/landing-page.tsx>) and its content module, change public signup/create-account conversion points—navigation, hero, and final CTA—from `/signup` to `/request-access` and label them **Request access**.
- Preserve adjacent `/login` actions for existing beta users.
- Leave `/signup` functional and unadvertised for invitation/admin-driven account creation. Do not redirect it globally unless invitation handling is explicitly redesigned later.
- Check mobile navigation, duplicated desktop/mobile CTA definitions, and content-driven labels so no public **Create account** path remains.

## 8. Verify behavior and release-note

- Add focused tests for:
  - Zod normalization, bounds, and allowlists.
  - Atomic duplicate-email behavior, including preservation of `INVITED` and `REJECTED` statuses.
  - New, duplicate, validation-error, unexpected-error, pending, and success form states.
  - Accessible names, invalid-state descriptions, live status, focus movement, and reduced-motion behavior where practical.
  - Landing CTAs targeting `/request-access` while login targets `/login`.
- Run scoped Prisma format/validation/generation, relevant database tests against an explicitly non-production development database, web typecheck, lint, formatting checks, and focused tests.
- Manually verify keyboard-only operation, 44px targets at narrow widths, light/dark contrast, reduced motion, pending-button stability, and the form-to-confirmation transition.
- Add the required patch changeset under [`.changeset/`](.changeset/) describing the user-facing private-beta request flow.

## Acceptance criteria

- Public account-creation CTAs lead to `/request-access`; existing-user login remains available.
- A valid request creates one normalized record, and repeats cannot create duplicates or reset moderation status.
- Invalid input receives specific accessible feedback without losing entered values.
- Success and duplicate submissions receive the same privacy-preserving confirmation.
- The form works with keyboard and screen-reader patterns, meets touch-target requirements, and remains understandable with reduced motion.
- Motion uses existing tokens, defined duration budgets, and purposeful opacity/transform transitions.
- `/signup` still works for invitation-only onboarding but is no longer promoted publicly.
