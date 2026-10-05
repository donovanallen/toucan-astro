---
name: Production deployment prep
overview: 'Harden the web app, auth, DB, and env handling for production; deploy it as an isolated beta at beta.scilentmusic.com without replacing the existing apex site; and set up repeatable deploy tooling (skills/commands/MCP).'
todos:
  - id: auth-gate
    content: Add middleware session gate + layout guard for (authenticated) routes and admin RBAC
    status: completed
  - id: env-schema
    content: Add zod env validation module and reconcile all .env.example files
    status: completed
  - id: images
    content: Adopt next/image in artwork/avatar components + remotePatterns config
    status: completed
  - id: next-config
    content: 'Security headers, optimizePackageImports additions in next.config.ts'
    status: completed
  - id: error-ux
    content: 'Segment error.tsx/loading.tsx, mount Toaster, replace console.error with logger'
    status: completed
  - id: seo
    content: 'Metadata (description/OG), favicon, robots.ts, sitemap.ts, metadataBase'
    status: completed
  - id: auth-hardening
    content: 'trustedOrigins, session config, rate limiting in packages/auth'
    status: completed
  - id: db-prod
    content: 'Pooled connection docs, root db:* aliases, migrate-deploy wiring'
    status: completed
  - id: ci
    content: New ci.yml (lint/typecheck/build/tests incl. apps/web + harmony-engine)
    status: completed
  - id: observability
    content: Sentry scaffold (env-gated) + /api/health route
    status: completed
  - id: platform-provisioning
    content: 'WS8: Beta Vercel project live; Sentry DSN verified 2026-09-15; remaining smoke-test items + apex cutover later'
    status: in_progress
  - id: runbook
    content: 'docs/DEPLOYMENT.md runbook: Vercel setup, env secrets, domain repurpose steps'
    status: completed
  - id: agent-tooling
    content: New production-readiness skill + deploy-check command; recommend Vercel MCP
    status: completed
isProject: false
---

# Production Deployment Prep

## Current shipped state (2026-09-15)

Sentry is **active on beta**. `NEXT_PUBLIC_SENTRY_DSN` (plus `SENTRY_AUTH_TOKEN` /
`SENTRY_ORG` / `SENTRY_PROJECT`) is set on Vercel Production, Preview, and Development.
Those source-map vars (and `MUSICBRAINZ_CONTACT`, Blob/Sentry auxiliary vars) are
also listed in `turbo.json` `tasks.build.env` so Turborepo forwards them during
`turbo build` — Vercel project env alone is not enough. A probe event was accepted
HTTP 200 on 2026-09-15. Server runtime falls back to `NEXT_PUBLIC_SENTRY_DSN` when
`SENTRY_DSN` is unset. Remaining WS8 work is auth/admin smoke tests, optional
Resend, Sentry MCP enablement, and later apex cutover — not DSN setup. Rate-limit
decision: [ADR 0001](../../docs/adr/0001-shared-rate-limiting.md).

## Progress (as of 2026-08-06)

PR [#128](https://github.com/donovanallen/scilent-x/pull/128) merged to `main`. Beta project **`scilent-music-beta`** is live at [`https://beta.scilentmusic.com`](https://beta.scilentmusic.com) (deploys from `main`). Existing apex stack left on **`scilent-music-web`** (`www.scilent.music`).

| WS    | Focus                 | Status          | Notes                                                                                                                                                                                                    |
| ----- | --------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Frontend hardening    | **Done**        | Middleware cookie gate, server auth layout, admin RBAC via Better Auth roles, `next/image` + remotePatterns, security headers, error/loading/Toaster, SEO (metadata/robots/sitemap/icon), logger cleanup |
| **2** | Env validation        | **Done**        | `apps/web/src/env.ts` (`@t3-oss/env-nextjs` + zod), instrumentation + next.config boot validation, reconciled `.env.example`s, `docs/AUTH.md` updated                                                    |
| **3** | DB / Prisma prod      | **Done**        | Root `db:*` aliases; pooled `DATABASE_URL` docs; `DATABASE_POOL_MAX`; `DIRECT_URL` for Prisma CLI; `verify-prisma` script; **migrate-on-deploy wired** in `apps/web/vercel.json` (Production only)       |
| **4** | Auth hardening        | **Done**        | `trustedOrigins`, session 7d/1d, rate limits, optional Resend                                                                                                                                            |
| **5** | CI/CD (in-repo)       | **Done**        | `.github/workflows/ci.yml`; `test.yml` includes `apps/web` + harmony-engine; `docs/DEPLOYMENT.md` + `apps/web/vercel.json`                                                                               |
| **6** | Observability (code)  | **Done**        | `/api/health` live on beta (`status: ok` + DB latency); `@sentry/nextjs` env-gated scaffold; `@vercel/analytics` mounted; **Sentry DSN set on beta** (verified 2026-09-15, probe HTTP 200)               |
| **7** | Agent tooling         | **Done**        | `production-readiness` skill + `/deploy-check`; Vercel MCP usable against `scilent-music-beta`; Sentry MCP remaining (DSN is live)                                                                       |
| **8** | Platform provisioning | **In progress** | Beta project + domain + DB + migrate-on-deploy **done**. Remaining: finish smoke-test checklist, optional Resend — **apex cutover deferred**. Sentry DSN verified 2026-09-15.                            |

**Beta is deployed and healthy.** Remaining work is checklist completion (auth/admin smoke tests) plus a later apex cutover — not more in-repo scaffolding. Sentry DSN is set.

## Confirmed deployment approach

- **Existing / legacy remains unchanged:** `scilent-music-web` continues serving `www.scilent.music` with its existing database during the beta period.
- **Isolated beta:** this repository deploys as **`scilent-music-beta`** whose Production domain is `beta.scilentmusic.com`. “Production” here is the Vercel environment name; the product remains beta.
- **Separate databases:** the legacy app and beta app use separate PostgreSQL databases managed through Prisma. The beta Vercel project receives only the beta `DATABASE_URL`; beta migrations and test data must never target the legacy database.
- **Later cutover:** after beta acceptance, move the chosen apex domain to this project, update canonical URL/auth environment variables, and redeploy. Keep or redirect `beta.scilentmusic.com` deliberately after cutover.

## Workstream 1 — Frontend production hardening (`apps/web`) ✅

- **Auth gate**: session-cookie check + redirect-to-`/login` in [apps/web/src/middleware.ts](apps/web/src/middleware.ts); server `getSession` in authenticated layout; admin RBAC via Better Auth roles (`hasAdminRole` / `isAdminUser`), not email allowlists.
- **Images**: `next/image` in scilent-ui artwork + web avatars; `images.remotePatterns` for Spotify / Apple / Tidal / Cover Art Archive / OAuth avatars.
- **next.config**: security `headers()`, `optimizePackageImports` includes `@scilent-one/ui` / `@scilent-one/scilent-ui`.
- **Error UX**: segment `error.tsx` + `loading.tsx`; root `<Toaster />`; server actions use `@scilent-one/logger`.
- **SEO/meta**: description + OG/Twitter, `icon.tsx`, `robots.ts`, `sitemap.ts`, `metadataBase` via `getSiteUrl()`.
- **Cleanup**: Prisma Studio link gated to development; setup link → `/admin/db/setup`.

## Workstream 2 — Env vars, secrets, validation ✅

- Typed env module: [apps/web/src/env.ts](apps/web/src/env.ts) (`@t3-oss/env-nextjs` + zod). Required: `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥32), `BETTER_AUTH_URL`. Validated at build (`next.config` import) and boot (`instrumentation.ts`). Skip with `SKIP_ENV_VALIDATION=true` or `NODE_ENV=test`.
- Reconciled [apps/web/.env.example](apps/web/.env.example), [packages/db/.env.example](packages/db/.env.example), [packages/auth/.env.example](packages/auth/.env.example); [docs/AUTH.md](docs/AUTH.md) points at canonical web template.
- Secrets live in Vercel project env settings (prod/preview split); nothing committed. **Required beta secrets are set** on `scilent-music-beta` (see [WS8](#workstream-8--platform-provisioning-in-progress)).

## Workstream 3 — DB & Prisma ✅

- Migrations under [packages/db/prisma/migrations](packages/db/prisma/migrations); package script `db:migrate:deploy`.
- Root `db:*` aliases in [package.json](package.json) + [AGENTS.md](AGENTS.md).
- Pooled URL guidance in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/DATABASE.mdx](docs/DATABASE.mdx).
- Optional `DATABASE_POOL_MAX` on `PrismaPg` (production default max **5** when unset).
- Prisma CLI prefers `DIRECT_URL` (falls back to `DATABASE_URL`) via [packages/db/prisma.config.ts](packages/db/prisma.config.ts); connectivity helper: `packages/db/scripts/verify-prisma.ts`.
- **Migrate-on-deploy wired** in [apps/web/vercel.json](apps/web/vercel.json): Production builds run `pnpm db:migrate:deploy` before `turbo build --filter=web`; Preview skips migrate.

## Workstream 4 — Auth hardening (`packages/auth`) ✅

- Set `trustedOrigins` from the prod URL, explicit session `expiresIn`/`updateAge`, and confirm `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` are required by the env schema.
- Enable Better Auth rate limiting on auth endpoints.
- Optional Resend email (verification + password reset) behind `RESEND_API_KEY` — no-ops when unset. OAuth login providers (Google/GitHub/Apple) were left disabled in this workstream.

**Later:** Google and Apple social login were enabled; GitHub remains reserved. Current setup is in [docs/AUTH.md](docs/AUTH.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Done in-repo:** `trustedOrigins` from `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` / `VERCEL_URL` ([packages/auth/src/origins.ts](packages/auth/src/origins.ts)); session 7d / refresh 1d; rate limits; optional Resend ([packages/auth/src/email.ts](packages/auth/src/email.ts)); [docs/AUTH.md](docs/AUTH.md). Changeset: [.changeset/auth-production-hardening.md](.changeset/auth-production-hardening.md).

## Workstream 5 — CI/CD + deployment (split)

### In-repo / CI (done) ✅

- **New [`.github/workflows/ci.yml`](.github/workflows/ci.yml)**: lint + typecheck + build (`turbo build --filter=web`) + full test suite on every PR — uses `SKIP_ENV_VALIDATION=true` so Next env schema does not need secrets in GitHub Actions.
- **Fixed [`.github/workflows/test.yml`](.github/workflows/test.yml)**: path filters include `apps/web` + `harmony-engine`; coverage job still covers social/scilent-ui/ui; separate step runs harmony-engine + web tests.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) runbook + [apps/web/vercel.json](apps/web/vercel.json) install/build (Production migrate gate).

### Platform / dashboard → [WS8](#workstream-8--platform-provisioning-in-progress)

- Beta Vercel project, DB, secrets, migrate-on-deploy, and `beta.scilentmusic.com` are **live** (see WS8 status). Remaining items are smoke-test / optional Resend / apex cutover. Sentry DSN is set (2026-09-15).

## Workstream 6 — Observability (code) ✅

- **`GET /api/health`**: DB `SELECT 1`, JSON `{ status, checks.database.{ status, latencyMs } }`, no auth (middleware already treats `/api/*` as public for cookie redirects). **Verified on beta** (2026-08-06): `status: "ok"` with DB latency.
- **Sentry** (`@sentry/nextjs`): `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`; `instrumentation.ts` registers + `onRequestError`; `withSentryConfig` in `next.config.ts` with source maps **disabled** unless `SENTRY_AUTH_TOKEN` is set; runtime `enabled: Boolean(dsn)`.
- Wired into [global-error.tsx](apps/web/src/app/global-error.tsx) and [handleApiError](apps/web/src/lib/api-utils.ts) (skips 401/403).
- Optional env in `apps/web/src/env.ts` + `.env.example`: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- **`@vercel/analytics`** mounted in root layout (live on beta).
- **Sentry DSN is set on the beta project** (verified 2026-09-15 via probe event, HTTP 200). `SENTRY_DSN` (server) is intentionally unset; `sentry.server.config.ts` falls back to `NEXT_PUBLIC_SENTRY_DSN`.

## Workstream 7 — Recommended tooling for repeatable deploys ✅

**Adopted / available:**

- **Vercel MCP** — usable against team `scilent-digitals-projects` / project `scilent-music-beta` (deployments, logs).
- **Sentry MCP** — DSN is live; enable MCP for issue triage.
- `gh` CLI for CI inspection.

**In this repo:**

- [`.cursor/skills/production-readiness/SKILL.md`](.cursor/skills/production-readiness/SKILL.md) — audit checklist.
- [`.cursor/commands/deploy-check.md`](.cursor/commands/deploy-check.md) — pre-deploy: `pnpm fix` + build + `changeset status` + env-example drift + migration/health considerations.

## Workstream 8 — Platform provisioning (in progress)

Canonical short copy also lives in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Status (2026-08-06)

| Step | Item                                                                                   | Status                                                                                                      |
| ---- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1    | Preserve existing production project (`scilent-music-web` / `www.scilent.music`)       | **Done** — left unchanged                                                                                   |
| 2    | Create beta Vercel project (`scilent-music-beta`, Root `apps/web`, Node 24.x)          | **Done** — linked via `.vercel/project.json`                                                                |
| 3    | Isolated beta Postgres + runtime `DATABASE_URL`                                        | **Done** — `/api/health` DB check OK                                                                        |
| 4    | Required beta Production env (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) | **Done** (app boots + health OK); keep Preview env reviewed                                                 |
| 5    | Migrate-on-deploy                                                                      | **Done** — `vercel.json` runs `pnpm db:migrate:deploy` when `VERCEL_ENV=production`                         |
| 6    | Domain `beta.scilentmusic.com` + TLS                                                   | **Done**                                                                                                    |
| 7    | Sentry project + DSN (+ optional source maps)                                          | **Done** (2026-09-15) — `NEXT_PUBLIC_SENTRY_DSN` + source-map vars on all Vercel envs; probe event HTTP 200 |
| 8    | Production vs Preview env / migrate gating                                             | **Done** for migrate gate; continue treating Preview DB as disposable                                       |
| 9    | Smoke-test checklist                                                                   | **Partial** — health + security headers + Sentry probe verified; auth/admin/Resend remaining                |
| 10   | Apex cutover (`scilentmusic.com`)                                                      | **Deferred** until beta acceptance                                                                          |
| 11   | Agent MCP                                                                              | **Partial** — Vercel MCP OK; enable Sentry MCP (DSN is live)                                                |

### Still outstanding

| From | Outstanding                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------ |
| WS4  | Re-verify login/session cookies on beta; optional Resend keys if email reset is required         |
| WS6  | Enable Sentry MCP (DSN already set). Re-confirm live errors via `/admin/status` probe as needed. |
| WS7  | Enable Sentry MCP                                                                                |
| WS8  | Finish remaining auth/admin smoke-test checklist; apex cutover only after acceptance             |

### Step-by-step runbook (reference — completed steps kept for replay)

#### 1. Preserve the existing production project ✅

1. Leave the current Vercel project (`scilent-music-web`), its domains, env, and database unchanged.
2. Do not move the apex domain or copy the existing production `DATABASE_URL` into the beta project.
3. Record which Git branch drives the old project so beta deployment work cannot accidentally change its production branch settings.

#### 2. Create the beta Vercel project ✅

1. Import this GitHub repo in Vercel (or `vercel link` from a machine with access).
2. Create it as a **new project**, separate from the project currently serving the apex / legacy site.
3. **Framework Preset:** Next.js.
4. **Root Directory:** `apps/web` (matches [apps/web/vercel.json](apps/web/vercel.json)).
5. Confirm **Install Command:** `cd ../.. && pnpm install` (monorepo root).
6. Confirm **pnpm** / Node versions match repo (`packageManager` in root `package.json`; beta currently on Node **24.x**).
7. Build command is owned by `apps/web/vercel.json` (see step 5).

#### 3. Provision the isolated beta database ✅

1. Create a new PostgreSQL database for the beta app in Prisma; do not reuse the legacy production database.
2. Obtain a connection string compatible with `@prisma/adapter-pg` / serverless.
3. Store it as `DATABASE_URL` only in the beta Vercel project. Prefer `DIRECT_URL` for Prisma CLI / migrate when the provider splits pooler vs direct.
4. Apply migrations and verify `/api/health` before heavy seed/test data.
5. Treat beta data as isolated and disposable unless a cutover data plan is approved.

#### 4. Environment variables ✅ (required); optional still TBD

Copy from [apps/web/.env.example](apps/web/.env.example). Set separately for **Production** and **Preview**.

**Required**

| Variable             | Value guidance                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`       | Isolated beta PostgreSQL URL managed through Prisma; never the existing site's database. Optional: `DATABASE_POOL_MAX=5` |
| `DIRECT_URL`         | Optional but recommended for Prisma migrate/CLI when using a pooled runtime URL                                          |
| `BETTER_AUTH_SECRET` | Beta-specific secret from `openssl rand -base64 32` (≥32 chars)                                                          |
| `BETTER_AUTH_URL`    | `https://beta.scilentmusic.com` (canonical origin, no trailing slash)                                                    |

**Optional — product**

| Variable                                                           | When                                                                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                              | Set to `https://beta.scilentmusic.com` for beta canonicals                                                                            |
| `LOG_LEVEL` / `MUSICBRAINZ_CONTACT` / `BETTER_AUTH_ADMIN_USER_IDS` | Ops / bootstrap                                                                                                                       |
| `RESEND_API_KEY` / `AUTH_EMAIL_FROM`                               | Password reset + email verification                                                                                                   |
| Spotify / Tidal / Apple Music keys                                 | Streaming features; register beta `/api/auth/oauth2/callback/spotify` and `.../tidal` (Apple Music: JWT origin via `BETTER_AUTH_URL`) |
| Google / Apple OAuth client vars                                   | Social login; see [docs/AUTH.md](docs/AUTH.md) / [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) callbacks                                   |

**Optional — Sentry (still open)**

| Variable                                              | When                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`                              | Browser + usually enough for all runtimes                   |
| `SENTRY_DSN`                                          | Server/edge override (falls back to public DSN in scaffold) |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Source-map upload on Vercel **build** env                   |

CI continues to use `SKIP_ENV_VALIDATION=true` — do **not** rely on that skip in Production.

#### 5. Beta migrate-on-deploy ✅

Configured in [apps/web/vercel.json](apps/web/vercel.json):

```bash
cd ../.. && if [ "$VERCEL_ENV" = "production" ]; then pnpm db:migrate:deploy; fi && pnpm turbo build --filter=web
```

Notes:

- Root alias `pnpm db:migrate:deploy` → `@scilent-one/db` `prisma migrate deploy`.
- Uses the beta project's `DATABASE_URL` / `DIRECT_URL`.
- Preview deployments skip migrate unless per-preview DB provisioning is added deliberately.
- Do **not** run `db:migrate` (dev) in production.
- Do not enable migrate-on-deploy on the legacy Vercel project.

#### 6. Beta domain / DNS ✅

1. Domain `beta.scilentmusic.com` attached to `scilent-music-beta`.
2. TLS serving; do not move apex domains from the legacy project during beta.
3. Production `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` should remain `https://beta.scilentmusic.com`.

#### 7. Sentry project — done (2026-09-15)

Replay for a new environment: create a Sentry Next.js project, copy the DSN into
`NEXT_PUBLIC_SENTRY_DSN` (and optionally `SENTRY_DSN`), set source-map
`SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT`, redeploy, then throw a test
error. **On beta this is complete:** DSN + source-map vars are set on Production,
Preview, and Development; a probe event returned HTTP 200. Server config falls
back to `NEXT_PUBLIC_SENTRY_DSN` when `SENTRY_DSN` is unset. Live client/server
tests: `/admin/status` error probe.

#### 8. Beta Production vs pull-request Preview behavior

| Concern           | Beta project's Production environment | Pull-request Preview environment                                                                |
| ----------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Public URL        | `https://beta.scilentmusic.com`       | Vercel-generated URL or a separate fixed preview hostname                                       |
| Env set           | Beta Production vars                  | Preview vars (separate)                                                                         |
| `BETTER_AUTH_URL` | `https://beta.scilentmusic.com`       | Prefer a fixed Preview URL when auth is exercised; `VERCEL_URL` is trusted via `trustedOrigins` |
| `DATABASE_URL`    | Isolated beta database                | Prefer another disposable preview database; never the existing site's database                  |
| Migrate-on-deploy | Yes (`VERCEL_ENV=production` gate)    | Disabled by the same gate                                                                       |
| Sentry            | Beta DSN / environment tag            | Optional separate project or same DSN with Preview environment tag                              |

#### 9. Beta smoke-test checklist

- [x] Deploy succeeds on `scilent-music-beta` from `main` (latest production READY as of 2026-08-06)
- [x] Legacy project left in place (`scilent-music-web` / `www.scilent.music`)
- [x] `GET https://beta.scilentmusic.com/api/health` → `{ "status": "ok", "checks": { "database": { "status": "ok", "latencyMs": <n> } } }`
- [ ] Sign up / login; session cookie set for the beta host
- [ ] Authenticated page loads; logout works
- [ ] Admin user reaches `/admin`; non-admin gets forbidden / redirect as designed
- [ ] A DB-backed route (feed/profile) returns beta data and does not expose existing production data
- [ ] Optional Resend: password-reset email when keys set
- [x] Optional Sentry: probe event accepted 2026-09-15; `/admin/status` error probe for live tests
- [x] Security headers present (`X-Frame-Options: DENY`, HSTS, `X-Content-Type-Options`, etc.)

#### 10. Final apex-domain cutover (later, after beta acceptance)

1. Back up both databases and define whether beta data is promoted, migrated, or discarded. Domain movement does not move data.
2. Confirm the new project is ready to use the intended final production database and apply migrations there before traffic cutover.
3. In Vercel, move `scilentmusic.com` (and/or the chosen apex) from the old project to the new project. DNS may remain unchanged when it already points to Vercel.
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the apex origin, then redeploy.
5. Update streaming OAuth callbacks, Resend links/sender configuration, and any external integrations that use the beta hostname.
6. Decide whether `beta.scilentmusic.com` remains a testing environment or redirects to the apex domain.
7. Smoke-test health, auth cookies, admin access, DB-backed pages, email, and integrations before retiring the old Vercel project.

#### 11. Post-go-live agent tooling

- **Vercel MCP** — enabled / usable for `scilent-music-beta`.
- Enable **Sentry MCP** (DSN is live on beta).
- Use `/deploy-check` and the `production-readiness` skill before subsequent promotes.

## Sequencing

**Done in-repo:** WS1–WS7. **Beta:** WS8 largely live at `beta.scilentmusic.com` (project, DB, migrate-on-deploy, DNS, Sentry DSN). **Finish WS8:** auth/admin smoke tests. **Final cutover:** move apex only after beta acceptance and a separate data/cutover review.
