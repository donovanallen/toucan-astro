# show-me examples

## Example 1: Call tree for an auth redirect

**Invoke:** `/show-me` after discussing why `/` sends signed-in users to `/home`.

**Expected response shape:** brief prose + a call tree (or Mermaid sequence), not a long essay.

```text
GET /
  getSession()
    if session
      redirect /home
    else
      render landing
```

## Example 2: Component tree for a settings surface

**Invoke:** "show me how appearance settings are wired"

```tsx
<SettingsPage> (apps/web/src/app/(authenticated)/settings/page.tsx)
  <AppearanceSettings>
    PaletteProvider (data-theme)
    next-themes (.dark)
```

## Example 3: Dense UI comparison → one HTML artifact

**Invoke:** `/show-me` when comparing two layout options that Mermaid cannot convey.

**Agent behavior:**

1. Write one file: `$TMPDIR/show-me-layout-options.html` (or `/opt/cursor/artifacts/...` on Cloud).
2. Use product tokens/labels; keep desktop + mobile readable.
3. Tell the user the absolute path (and open/link it). Do not commit the file.
