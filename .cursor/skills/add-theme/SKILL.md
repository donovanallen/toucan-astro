---
name: add-theme
description: Add a new preset color palette (theme) to the scilent-x web app. Use when the user wants to add, create, or scaffold a new theme/palette/color scheme, or mentions the appearance/theme picker. Guides an interactive flow to generate the globals.css token blocks and register the palette.
disable-model-invocation: true
---

# Add a Theme (Color Palette)

> **Retired multi-palette architecture.** The optional "Pro" palette this
> skill used as its worked example was retired — see
> [`docs/BRAND.md`](../../../docs/BRAND.md) and
> [`docs/research/brand-system-alignment-audit.md`](../../../docs/research/brand-system-alignment-audit.md).
> There is now a single canonical monochrome + sand brand system with no
> `data-theme` palette picker: `apps/web/src/components/palette-provider.tsx`,
> the `PALETTES` registry, and the Appearance palette picker no longer exist.
> `apps/web/src/lib/themes.ts` is now just a documentation stub for the
> deprecated `User.palette` database field.
>
> If a future request needs a second selectable palette, treat this as a new
> feature rather than following the steps below verbatim: they describe a
> `data-theme` + provider + registry architecture that would need to be
> rebuilt, and any new palette should be evaluated against `docs/BRAND.md`
> first — the brand system's stance is that Scilent intentionally does not
> own a chromatic hue outside the single sand accent.

Historically, the theme system had two independent axes: **mode**
(light/dark/system, via `next-themes` + `.dark` class — still true today) and
**palette** (via a `data-theme` attribute — retired). The steps below are kept
for archaeological reference only.

## Interactive flow

Copy this checklist and work through it:

```
Add-theme progress:
- [ ] Step 1: Gather palette metadata
- [ ] Step 2: Add token blocks to globals.css
- [ ] Step 3: Register the palette in themes.ts
- [ ] Step 4: Verify (typecheck + build)
- [ ] Step 5: Changeset
```

### Step 1: Gather metadata

Ask the user (use the AskQuestion tool if available, otherwise ask inline):

- **id**: lowercase kebab-case, unique (e.g. `ocean`, `sunset`). Becomes the
  `data-theme` value.
- **label**: display name for the picker (e.g. `Ocean`).
- **description**: one short sentence for the picker.
- **base hue / vibe**: an OKLCH hue (0-360) or a described feel (e.g. "cool
  blue", "warm amber ~61", "green ~150"). Used to derive the ramp.

Do NOT use `default` as an id — that is the base palette (`:root` / `.dark`) and
has no `data-theme` selector.

### Step 2: Add token blocks to `packages/ui/src/globals.css`

Insert two blocks immediately before the `@theme inline {` block, after any
existing `[data-theme=...]` blocks. Fill in OKLCH values derived from the chosen
hue. Keep foreground/background pairs at WCAG AA contrast.

CRITICAL SPECIFICITY RULE: `[data-theme='<id>']` and `.dark` have equal
specificity (0,1,0). In "<id> + dark" both match, and the dark block only wins
because `[data-theme='<id>'].dark` is (0,2,0). Therefore the dark block MUST
redefine **every** token the light block defines, or a light value leaks into
dark mode via source order. Keep both blocks declaring the exact same token set.

Template (replace `<id>` and every `oklch(...)`; keep the token list identical
in both blocks):

```css
[data-theme='<id>'] {
  /* <Label> - Light mode */
  --background: oklch(...);
  --foreground: oklch(...);
  --card: oklch(...);
  --card-foreground: oklch(...);
  --popover: oklch(...);
  --popover-foreground: oklch(...);
  --primary: oklch(...);
  --primary-foreground: oklch(...);
  --secondary: oklch(...);
  --secondary-foreground: oklch(...);
  --muted: oklch(...);
  --muted-foreground: oklch(...);
  --accent: oklch(...);
  --accent-foreground: oklch(...);
  --border: oklch(...);
  --input: oklch(...);
  --ring: oklch(...);

  --chart-1: oklch(...);
  --chart-2: oklch(...);
  --chart-3: oklch(...);
  --chart-4: oklch(...);
  --chart-5: oklch(...);

  --selection: oklch(...);
  --selection-foreground: oklch(...);

  --sidebar: oklch(...);
  --sidebar-foreground: oklch(...);
  --sidebar-primary: oklch(...);
  --sidebar-primary-foreground: oklch(...);
  --sidebar-accent: oklch(...);
  --sidebar-accent-foreground: oklch(...);
  --sidebar-border: oklch(...);
  --sidebar-ring: oklch(...);
}

[data-theme='<id>'].dark {
  /* <Label> - Dark mode (redefine the SAME token set) */
  /* ...same tokens as above, dark values... */
}
```

Notes:

- No changes to `@theme inline` are needed: it already maps every `--color-*` to
  `var(--*)`, so overriding a token here flows into `bg-*`/`text-*` utilities.
- Leave `--destructive*` / `--success*` out (they stay semantic and inherit the
  base). If you do override them, add them to BOTH blocks.
- Do NOT touch `:root` or `.dark` (that is the `default` palette).
- Colors only: don't add `--radius`, `--shadow-*`, or `--font-*` here yet.

### Step 3: Register in `apps/web/src/lib/themes.ts`

- Add the id to the `PaletteId` union.
- Append an entry to `PALETTES` with `id`, `label`, `description`, and a
  `swatch` (`{ light, dark }`) using representative primary colors for the picker
  preview.

The picker (`apps/web/src/components/appearance-settings.tsx`) and provider
(`apps/web/src/components/palette-provider.tsx`) read from this registry
automatically. No other code changes are required.

### Step 4: Verify

```bash
pnpm typecheck --filter web
pnpm build --filter web
```

Then, if a dev server is running, set the palette and reload to confirm it
applies with no flash (light and dark):

```js
localStorage.setItem('scilent-palette', '<id>');
location.reload();
```

Confirm switching back to `default` (remove the key or pick Default in
Settings -> Appearance) fully reverts.

### Step 5: Changeset

`globals.css` is part of `@scilent-one/ui`, so author a changeset (see
`docs/RELEASE.md`):

```bash
pnpm changeset
```

Select `@scilent-one/ui`, choose `minor`, and describe the new palette. Files
under `apps/web` are also versioned; include `web` in the same changeset when
the theme work changes the app registry or other user-facing app behavior.

## Reference: how the pieces connect

- Token blocks: `packages/ui/src/globals.css` (`[data-theme='pro']` is the
  worked example).
- Registry: `apps/web/src/lib/themes.ts`.
- Provider + no-flash: `apps/web/src/components/palette-provider.tsx` and the
  inline script in `apps/web/src/app/layout.tsx`.
- Picker UI: `apps/web/src/components/appearance-settings.tsx`, mounted in
  `apps/web/src/app/(authenticated)/settings/page.tsx`.
