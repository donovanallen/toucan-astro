# Delight — examples (scilent-x)

## Example 1: Marketing landing (elegant ambient)

**Invoke:** `/delight` the landing page

**Expected behavior:**

1. Infer tone from `landing-page.tsx` / `landing.css` (dark, mono, amber, spotlight).
2. Propose a short opportunity table, then implement ambient/micro polish only.
3. Keep `SHOW_BELOW_FOLD` and product CTAs intact.

**Typical changes:**

- Live eyebrow slot (default copy until time-aware options are chosen)
- CTA hover lift + press scale using `duration-fast` / `ease-out`
- Nav wordmark/logo slight scale on hover
- Quiet developer console line; no new particle system

## Example 2: Login / signup (task-focused warmth)

**Invoke:** `/delight` login and signup

**Expected behavior:**

1. Treat auth as high-frequency task UI — near-imperceptible motion only.
2. Soften descriptions and error fallbacks; keep titles stable if e2e asserts them
   (`Welcome back`).
3. Card settle entrance + input focus transitions; loading label on submit.

**Avoid:**

- Confetti on successful sign-in
- Wacky error jokes that obscure the failure
- Changing Better Auth flows or redirect logic

## Example 3: Stop — would contradict constraints

**Invoke:** `/delight` and change how Harmony scores matches with celebratory UX

**Correct behavior:** Skill may suggest presentation polish later; do not alter
scoring or API contracts. Ask permission or ship docs-only.
