# Deploy check

Pre-deploy verification for the scilent-x monorepo. Run quality gates, spot
env-example drift, and call out migration / health considerations before a
production promote. Does **not** provision Vercel/Sentry (that is WS8).

## Task

1. Confirm branch / dirty tree:
   - `git status`
   - Note unrelated WIP (do not mix into deploy commits)
2. Quality from repo root:
   - `pnpm fix` (lint + format + typecheck)
   - `SKIP_ENV_VALIDATION=true pnpm turbo build --filter=web`
   - `pnpm test --filter=web` (and any other packages this branch touched)
3. Changesets:
   - `pnpm changeset status`
   - If user-facing `apps/web` code or `packages/*` (except `packages/tooling`) changed without a
     changeset, run `pnpm changeset` before considering the branch ready (see
     `docs/RELEASE.md`)
4. Env / examples drift:
   - Diff `apps/web/.env.example` vs keys in `apps/web/src/env.ts`
   - Confirm optional Sentry / Resend / streaming vars are documented
   - Confirm `packages/db/.env.example` notes `DATABASE_POOL_MAX` if pool sizing changed
5. Migrations / health:
   - `pnpm db:migrate:deploy` is the production apply command (root alias) — ensure
     it is wired on Vercel in WS8; locally you can run
     `pnpm --filter @scilent-one/db exec prisma migrate status` when a DB is available
   - After deploy, `GET /api/health` should return `status: "ok"` with DB latency
6. Auth / origins smoke reminders:
   - Production `BETTER_AUTH_URL` matches the public HTTPS origin
   - Preview env has its own `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` when using a
     fixed preview domain; `VERCEL_URL` is already trusted via `trustedOrigins`
7. Observability reminders:
   - Runtime Sentry stays disabled until DSN env vars are set (local/preview without DSN)
   - Beta Production already has `NEXT_PUBLIC_SENTRY_DSN` (verified 2026-09-15). Re-confirm
     an intentional error in Sentry via `/admin/status` error probe when promoting.

## Requirements

- Prefer fixing failures in the working tree over suppressing checks
- Do not create a Vercel project, paste secrets, or invent DSNs
- Do not commit unless the user asks
- Follow @AGENTS.md and the production-readiness skill checklist

## Output

Report:

- Commands run and pass/fail
- Changeset status
- Env-example / schema drift (if any)
- Migration / health / WS8 items still outstanding
- Ready to deploy? yes / no + blockers
