# Admin Subdomain Proposal — admin.donovanallen.dev

Status: proposal only. No DNS, Vercel, or code changes have been made.
Implementation is prod-affecting (new subdomain) and waits for Donovan's explicit go.

## Goal

An authenticated admin surface at admin.donovanallen.dev showing repo status, deploy
state, content dashboards, and whatever else later. Must become a **repeatable pattern**
for future subdomains (e.g. status.donovanallen.dev).

## Constraints

- Current setup: static Astro site on Vercel **Hobby** plan (no paid features).
- Repo (`toucan-astro`) is public; admin must not leak anything the public site doesn't.
- DNS changes are gated on Donovan's go.

## Options considered

| Option | Auth | Cost | Verdict |
| --- | --- | --- | --- |
| **A. Separate Vercel project, Astro SSR + GitHub OAuth** | OAuth (Auth.js / Arctic), gate on username `donovanallen` | free (Hobby includes serverless functions) | **Recommended** |
| B. Vercel Password Protection | built-in | requires **Pro** ($20/mo) | rejected: cost |
| C. Cloudflare Access in front | zero-code IdP | free tier, but requires moving DNS to Cloudflare | rejected: DNS migration risk |
| D. Static page + client-held token (PAT in browser) | none real | free | rejected: token exposure |
| E. Single passphrase login (cookie + serverless check) | passphrase | free | viable fallback; simpler but weaker |

## Recommended architecture (Option A)

- **New private repo** `toucan-admin`, new **Vercel project** `toucan-admin`, Astro in
  hybrid/SSR mode, deployed on `admin.donovanallen.dev`.
- **Auth:** GitHub OAuth app → Auth.js session → middleware allows only
  `donovanallen`. Everything else: 404 (not 403 — don't confirm the path exists).
- **Secrets:** `GITHUB_CLIENT_ID/SECRET` in Vercel env vars (server-side only).
- **Dashboards (phase 1):**
  - Repo status via GitHub REST (open PRs, recent commits, CI status)
  - Deploy state via Vercel REST (latest production deployment, build status)
  - Live-site smoke check (fetch www.donovanallen.dev, verify expected markers)
  - Content viewer: renders `src/data/site.json` + `portfolio.js` from the repo via
    GitHub raw — read-only preview of what the site would show
- **Phase 2 (self-service content):** edit `site.json` in-browser → commit via GitHub
  API → main push auto-deploys. This closes the loop with the content-update goal:
  edit → commit → live in ~1 min, no local tooling.
- **All API calls proxied through serverless functions** so tokens never reach the browser.

## Repeatability pattern

1. One private repo + one Vercel project per subdomain (or one monorepo with a shared
   auth middleware — decide at >2 subdomains).
2. Shared GitHub OAuth app; per-project username allowlist env var.
3. DNS: each subdomain is a CNAME to Vercel (single change, gated on Donovan).
4. Env-var contract documented in each repo's AGENTS.md.

## Risks / notes

- GitHub OAuth app creation + Vercel env vars need Donovan's accounts — walk-through needed.
- Hobby plan function limits are ample for a personal admin dashboard.
- Keeping admin out of the public repo keeps any future sensitive tooling private.

## Next steps (on go)

1. Create private repo + Vercel project (no DNS yet) and build auth + phase-1 dashboards.
2. Verify on a `.vercel.app` preview URL.
3. With Donovan's go: add CNAME for admin.donovanallen.dev, attach domain to project.
