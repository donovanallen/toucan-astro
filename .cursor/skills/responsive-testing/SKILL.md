---
name: responsive-testing
description: Open the app in Cursor's browser at multiple viewport sizes, screenshot each, and report any layout breakage. Use when the user asks for responsive testing, breakpoint checks, layout verification across viewports, or invokes /responsiveness.
user-invocable: true
---

# Responsive Testing

After a UI change, verify the app looks correct at standard Tailwind breakpoints using Cursor's browser MCP.

## Viewports to Test

| Name           | Width | Height | Tailwind         | CDP `mobile` |
| -------------- | ----- | ------ | ---------------- | ------------ |
| Mobile (small) | 375   | 812    | default (`< md`) | `true`       |
| Mobile (large) | 428   | 926    | default (`< md`) | `true`       |
| Tablet         | 768   | 1024   | `md:` (768px+)   | `false`      |
| Desktop        | 1280  | 800    | `xl:` (1280px+)  | `false`      |
| Ultrawide      | 1536  | 900    | `2xl:` (1536px+) | `false`      |

Default Next.js URL: `http://localhost:3000`. Confirm the running port from the `pnpm dev` terminal if needed.

## Workflow

### 1. Open and lock

1. `browser_tabs` with `action: "list"` — reuse an existing tab if present
2. `browser_navigate` to the target URL
3. `browser_lock` with `action: "lock"` before interactions (required once a tab exists)

### 2. For each viewport

**Resize** via `browser_cdp` (not `browser_navigate` — it has no viewport params):

```json
{
  "method": "Emulation.setDeviceMetricsOverride",
  "params": {
    "width": 375,
    "height": 812,
    "deviceScaleFactor": 2,
    "mobile": true
  }
}
```

Use `deviceScaleFactor: 1` and `mobile: false` for tablet/desktop/ultrawide.

**Verify** the override stuck:

```json
{
  "method": "Runtime.evaluate",
  "params": {
    "expression": "JSON.stringify({ w: window.innerWidth, h: window.innerHeight, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, hasHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth })",
    "returnByValue": true
  }
}
```

Expect `w` to match the target width. `hasHScroll: true` is almost always a FAIL.

**Capture evidence:**

1. `browser_take_screenshot` with a clear `filename` (e.g. `responsive-375.png`). Prefer viewport shots; use `fullPage: true` only when checking long-page overflow.
2. `browser_snapshot` — inspect the a11y tree for missing nav, unreachable controls, or content that vanished without a menu toggle.

**Screenshot caveat:** the Cursor browser panel may letterbox emulated viewports (content strip + empty chrome). Judge layout from page content and the JS metrics above, not the empty panel margins.

**Optional overflow probe** for a suspicious element: `browser_get_bounding_box` and check if `x + width` exceeds the viewport width.

### 3. Check for common breakage

- **Overflow**: `hasHScroll` or elements wider than the viewport
- **Collapsed layout**: Flex/grid items that should stack below `md` but stay in a row
- **Hidden content**: Critical UI gone with no hamburger/drawer alternative
- **Touch targets**: Buttons/links cramped on 375/428
- **Font scaling**: Unreadable text on mobile
- **Fixed UI**: Modals, toasts, sticky headers clipped or unusable on small screens
- **Images**: Don't scale down (`max-w` / `h-auto` missing)
- **Ultrawide**: Content stretched edge-to-edge with no sensible max-width / centering

### 4. Cleanup

1. `browser_cdp` → `Emulation.clearDeviceMetricsOverride`
2. `browser_lock` with `action: "unlock"`

### 5. Report

```
Responsive Test Results:
  375px (mobile):  PASS — layout stacks correctly
  428px (mobile):  PASS
  768px (tablet):  WARN — nav items overlap, need hamburger menu
  1280px (desktop): PASS
  1536px (ultrawide): WARN — content not centered, stretched too wide
```

Statuses: `PASS` | `WARN` | `FAIL`. Fix failures/warnings, then re-test only the affected viewports.

## Related

Reusable components that adapt to available space (not the viewport) should use
Tailwind container queries — see `prefer-container-queries`. This skill still
proves page-level layout at real viewport sizes; use both when a change touches
shared UI **and** app chrome.
