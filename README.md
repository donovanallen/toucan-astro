# donovanallen.dev — source

The source code for [donovanallen.dev](https://donovanallen.dev), Donovan Allen's personal
portfolio site. Plain **Astro**, statically built, no framework UI layer, no backend, no
database. Content and layout live in a handful of small files, so updating the site is
close to editing text.

## Stack

- [Astro](https://docs.astro.build) — static output (`output: 'static'`), file-based routing
- **SCSS** for styling — design tokens (palette, Utopia fluid type/spacing scale) in
  `src/styles/_vars.scss`, shared rules in `src/styles/global.scss`
- **Vanilla inline JS only** — two tiny scripts (typed marquee on the landing page,
  scramble greeting on /about); no component frameworks
- Self-hosted fonts (`public/fonts`) — TT-Hoves + Montserrat variable
- Deployed on [Vercel](https://vercel.com) (project `toucan-astro`); pushes to `main`
  auto-deploy to production

## Editing content (no code changes needed)

Site copy and links are data, not markup:

- **`src/data/site.json`** — site title/tagline, contact email, social links, the
  landing-page marquee words, the /about greetings list, and the bio paragraph
- **`src/data/portfolio.js`** — portfolio project data (titles, subtitles, overviews,
  skills, images, page ordering)

Edit either file and push — Vercel rebuilds and the change is live in under a minute.
Images for portfolio pages live in `public/images/<project>/`.

## Project structure

```text
src/
  data/           # site.json + portfolio.js — the content source of truth
  layouts/        # Layout.astro — nav, footer, meta/OG tags, skip link
  pages/          # /, /about, /contact, /portfolio + 4 portfolio detail pages
  components/     # PortfolioPage.astro — shared portfolio detail layout
  styles/         # _vars.scss (tokens), global.scss (base styles)
public/
  fonts/          # self-hosted TT-Hoves + Montserrat
  images/         # portfolio imagery
  icons/          # contact-page social icons
.cursor/          # agent tooling: rules, skills, commands (see AGENTS.md)
```

## Development

| Command           | Action                                   |
| :---------------- | :--------------------------------------- |
| `npm install`     | Install dependencies (Node >= 22.12)     |
| `npm run dev`     | Local dev server at `localhost:4321`     |
| `npm run build`   | Production build to `./dist/`            |
| `npm run preview` | Preview the production build locally     |

## Versioning

Managed with [Changesets](https://github.com/changesets/changesets). To release:

```sh
npx changeset            # describe your change, pick a semver bump
npx changeset version    # consume changesets → bumps package.json + CHANGELOG.md
```

The site footer reads the version from `package.json` at build time — bump it, build,
and the new version appears on the site.

## Conventions

Agent-facing rules (visual identity, deploy gates, rules of engagement) are in
[AGENTS.md](AGENTS.md) and `.cursor/`. Key ones: don't push to `main` without
Donovan's go; preserve the misty blue-gray palette / TT-Hoves / uppercase identity;
keep the JS surface tiny.
