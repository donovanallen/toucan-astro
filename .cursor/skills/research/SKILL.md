---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, reading legwork delegated to a background agent, or invokes /research.
disable-model-invocation: true
user-invocable: true
---

# Research

Spin up **exactly one background agent** to do the research, so you keep working while it reads.

## Recursion guard

Before spawning, check whether this turn is already the delegated researcher:

- If the Task prompt (or parent handoff) includes `RESEARCH_SUBAGENT=1`, this agent is already the researcher. **Do not spawn any agent.** Perform the research and write the report directly.
- Otherwise, launch exactly one background `Task` with:
  - `run_in_background: true`
  - `subagent_type: "generalPurpose"` for external docs/APIs, or `"explore"` when the question is primarily this codebase
  - Prompt must include `RESEARCH_SUBAGENT=1` and an explicit instruction not to delegate or spawn further subagents
  - Prompt must name the output path under `docs/research/<topic-slug>.md`

Never create a second research agent as a retry. If the delegated agent stalls or fails, stop/close it and complete the research in the original conversation.

## The researcher's job

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source (URL or repo path).
3. Save under `docs/research/` using a kebab-case slug (e.g. `docs/research/better-auth-trusted-origins.md`). If a closer convention already exists for the topic, match it and say where you put the file.

## Report shape

```markdown
# <Topic>

## Question

<one paragraph restating what was asked>

## Findings

- Claim — source
- Claim — source

## Open questions

- Anything still ambiguous after primary sources
```

## In this repo (scilent-x)

- Prefer citing this monorepo's own docs (`docs/`, `agents/`, package READMEs) when the question is local.
- Do not invent product behavior, env vars, or API contracts in the report — quote what exists.
- Research is read-only unless the user separately asks for implementation.
