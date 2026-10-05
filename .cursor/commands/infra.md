# Infra

Run the project **infra-steward** subagent.

Follow `.cursor/agents/infra-steward.md` (runbook: `docs/INFRA.md`).

If arguments were passed, treat them as the focus (`status`, `deps`, `ci`, `vercel`, a PR URL, an advisory). Default: full ops loop and an Infra status report shaped for Slack `#scilent-infra`.
