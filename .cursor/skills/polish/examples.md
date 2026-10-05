# polish examples

## Example 1: After a feature lands

**Invoke:** `/polish` on the authenticated catalog grid.

**Expected:** Walk list/grid toggle, keyboard focus on cards, empty/loading
search, mobile toolbar hit targets. Fix missing `focus-ring` / undersized
toggles; do not redesign card layout.

## Example 2: Stacked with minimalist-ui

**Invoke:** `/minimalist-ui` audit, then `/polish`.

**Expected:** Minimalist finds missing focus rings and admin gradient chrome;
polish verifies focus works with keyboard, touch targets on toolbars, and
tokenized motion durations. See [divergences.md](divergences.md) if aesthetic
rules fight (e.g. Lucide ban).

## Example 3: Stop — would redesign

**Finding:** Landing hero feels “generic SaaS.”

**Correct:** Say so and recommend `/minimalist-ui` + product brief, or a
dedicated redesign — do not smuggle a new visual world through polish.
