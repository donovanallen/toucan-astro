---
name: wizard
description: Generates an interactive Bash wizard for manual procedures only a human can complete. Use when provisioning infrastructure, setting up credentials or CI secrets, navigating an unfamiliar third-party dashboard, or running a one-off migration or cutover; do not use for steps the agent can perform itself.
disable-model-invocation: true
user-invocable: true
---

# Wizard

A wizard walks a human through a manual procedure that is tedious to do by
hand and tedious to re-explain. It opens each URL, gives precise instructions,
captures values, writes them to their destinations, confirms risky actions,
and reports progress.

Use [`template.sh`](template.sh) for the interaction library. Everything above
its `STAGES` marker must remain identical; only author the stages below it.
Wizards are ephemeral by default. Commit one under `scripts/` only when the
user wants a repeatable setup path.

## Workflow

### 1. Scope the procedure

Read the repo before asking questions:

- Setup: inspect `.env*`, READMEs, Docker Compose files, framework config, and
  every `secrets.*` / `vars.*` reference in `.github/workflows/`.
- Migration or cutover: establish the current state, target state, and every
  irreversible action between them.

List the stages in dependency order and, for every captured value, identify:

1. where the human obtains it;
2. where it is written (`.env`, GitHub secret/variable, both, or nowhere);
3. whether it is secret or public.

Show this list to the user and confirm it before authoring. Let them add,
remove, or reorder stages.

### 2. Map each stage

Give the exact journey: URL, navigation path, action, value location, and
destination variable. Verify current third-party instructions from official
documentation when uncertain. Never invent dashboard steps or commands.

Keep each stage focused enough that its required instructions remain visible
after the wizard clears the terminal.

Human-facing `say` / `step` / `note` copy follows
`.cursor/skills/i-have-adhd/SKILL.md`: lead with the action the human does now,
number multi-step instructions (cap 5 visible steps per stage; split "do now" vs
"later" if needed), no preamble or closing pleasantries.

### 3. Author the wizard

1. Copy `template.sh` to the target path.
2. Replace only the example below the `STAGES` marker.
3. Set `TOTAL_STAGES` to the exact number of `stage` calls.
4. Use the library helpers:
   - `stage`, `say`, `step`, `note`, `warn`
   - `open_url`
   - `ask` for public values and `ask_secret` for secrets
   - `write_env`
   - `set_secret` only for CI secrets and `set_var` for CI variables
   - `pause` and `confirm`
5. Open a URL before asking for its value.
6. Add `confirm` immediately before every irreversible action.

Every persisted value must use `write_env`. Every `set_secret` or `set_var`
name must exactly match a workflow reference.

### 4. Verify and hand off

```bash
bash -n <script>
command -v shellcheck >/dev/null && shellcheck <script>
chmod +x <script>
```

Do not run the wizard end to end: it opens browsers and blocks on human input.
Trace it statically instead:

- every scoped value is captured and reaches its declared destination;
- secret values use hidden input;
- `TOTAL_STAGES` matches the number of stages;
- irreversible actions have confirmation gates;
- CI names exactly match workflow references.

Tell the user how to run it. For a committed, repeatable wizard, link it from
the relevant README or setup guide.
