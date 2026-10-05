# AGENTS.md

Root entry point for Cursor and other AGENTS.md-aware tools. Short by design — it orients an
agent; the detailed conventions live in `.cursor/` (rules, commands, skills) rather than here.

## Project

**toucan-astro** is the source for [donovanallen.dev](https://donovanallen.dev) — Donovan Allen's
personal site. Plain **Astro 7, static output** (`output: 'static'`), plain JS + SCSS. No
framework UI layer, no backend, no database.

```
src/
  pages/        # file-based routes: /, /about, /contact, /portfolio, 4 portfolio detail pages
  components/   # nav, footer, portfolio components
  styles/       # SCSS: _vars.scss (Utopia fluid scale, palette), global.scss
public/
  fonts/        # Montserrat variable + TT-Hoves weights (self-hosted)
  images/       # portfolio imagery (scilent-ui, sd01, lululemon, f1)
```

## Development

Start the dev server in background mode (`astro dev --background`); manage with
`astro dev stop` / `astro dev status` / `astro dev logs`. Full docs: https://docs.astro.build —
consult the routing / components / styling guides before related tasks.

## Content source of truth

Portfolio content is ported from the legacy React site (`~/src/toucan-react`, read-only
reference — do not modify it). The original resolved portfolio items by a `link` key; keep that
pattern (the legacy code had a stale-index bug we fixed).

## Deploy

- GitHub: `donovanallen/toucan-astro` (public)
- Vercel project **toucan-astro** (team `scilent-digitals-projects`), framework preset `astro`,
  deployment protection disabled
- donovanallen.dev still points at Firebase Hosting — DNS cutover to Vercel is pending and is a
  prod-affecting action requiring Donovan's explicit go

## Rules of engagement

- Never push/deploy to production or touch DNS without Donovan's explicit go
- Match the existing visual identity: misty blue-gray palette (`$dark #2b2d42`,
  `$light #edf2f4`, `$med #8d99ae`), TT-Hoves type, Utopia fluid scale in `_vars.scss`
- Keep the JS surface tiny: vanilla inline scripts only (typed marquee, scramble greeting) —
  no component frameworks
- Site title is "Donovan Allen" — no year suffix (the old site went stale that way)
