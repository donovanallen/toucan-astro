# Cloud environment setup

Prepare this repository for agentic development in a Cursor Cloud environment.

## Task

1. Follow `.cursor/environment.json` and run its install command if dependencies or generated
   files are not ready.
2. Verify these runtime secret names are present without printing their values:
   - `DATABASE_URL` — a dedicated non-production development database
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` — normally `http://127.0.0.1:3000` for browser tests
   - `AGENT_TEST_ACCOUNT_PASSWORD`
3. If a required secret is missing, report the name and direct the user to the environment-scoped
   Secrets tab. Never invent, print, commit, or copy a secret into an env file.
4. Confirm the configured database is explicitly intended for agent development. Do not migrate,
   seed, or otherwise write to a production database.
5. Run `bash scripts/cloud-agent-seed-test-account.sh`. It idempotently creates or refreshes only
   the dedicated agent profile when its password secret is configured.
6. Start the web app with `pnpm dev:web`, then verify the account can sign in and reach `/home`.

## Test account

- Email: `agent@scilent.local`
- Password: `$AGENT_TEST_ACCOUNT_PASSWORD`
- Username: `agent`
- Role: `user`
- Profile: verified and onboarding-ready; no streaming provider is linked

## Requirements

- Treat the account as test data. Do not grant it admin privileges or reuse it in production.
- Never display secret values in terminal output, screenshots, recordings, or summaries.
- Do not run `pnpm db:push` against a shared database. Apply committed migrations with
  `pnpm db:migrate:deploy` only when the user has confirmed the agent database and migrations are
  required.
- If provisioning fails because the schema is missing or stale, report that exact condition before
  applying database changes.
