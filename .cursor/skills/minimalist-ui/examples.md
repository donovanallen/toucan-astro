# minimalist-ui examples

## Example 1: Full-surface audit

**Invoke:** `/minimalist-ui` — "Audit the web app for consistency, balance, and usability."

**Expected behavior:**

1. Scope `apps/web`, `packages/ui`, `packages/scilent-ui`.
2. Run the checklist (fonts, shadows, focus, tokens, copy, motion).
3. Emit a Severity / Issue / Location / Fix table.
4. Ship safe shared-component fixes (focus rings, token bugs, cliché copy).
5. Defer brand-font swaps and landing redesigns.

## Example 2: Focus-ring pass

**Finding:** Catalog cards use `role="button"` + `tabIndex={0}` without
`focus-visible` styles.

**Fix:** Add the `focus-ring` utility (from `packages/ui` globals) to
`AlbumCard`, `ArtistCard`, `TrackCard`, list items, and author name buttons.

## Example 3: Token hygiene

**Finding:** `shadow-[0_0_0_1px_hsl(var(--sidebar-border))]` on an oklch token.

**Fix:** `shadow-[0_0_0_1px_var(--sidebar-border)]` or `ring-1 ring-sidebar-border`.

## Example 4: Stop — would rewrite the brand

**Invoke:** "Apply minimalist-ui and replace Space Grotesk with Newsreader + Geist."

**Correct behavior:** Explain that font stacks are brand decisions owned by
`globals.css` / themes. Offer an audit + token-aligned polish instead, or ask
for explicit permission before a typography redesign.
