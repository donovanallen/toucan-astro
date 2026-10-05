#!/usr/bin/env bash
# beforeShellExecution hook, matched on `git commit`.
#
# scilent-x uses Changesets for versioning (see .changeset/config.json).
# This is the Cursor-native analogue of cams-web-client's husky
# pre-commit/pre-push quality gates (lint-staged + typecheck on commit,
# lint:fix + typecheck + build on push) — adapted to this repo's actual
# release process instead of copying husky verbatim, since a package-level
# change with no changeset silently produces no version bump / changelog
# entry at release time (`pnpm changeset` -> `pnpm version` -> `pnpm release`).
#
# Behavior: if the commit's staged changes touch a versioned package
# (packages/* other than tooling, which has no "version" semantics for
# consumers) or apps/web, and no new file was staged under .changeset/,
# ask the agent to confirm before committing. apps/mobile remains excluded
# through .changeset/config.json "ignore".
# Never blocks outright (failClosed: false in hooks.json) — this is a
# reminder, not a gate.
set -euo pipefail

input="$(cat)"

if command -v jq >/dev/null 2>&1; then
  command_str="$(printf '%s' "$input" | jq -r '.command // empty')"
else
  command_str="$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("command",""))' 2>/dev/null || true)"
fi

if [[ "$command_str" != *"git commit"* ]]; then
  echo '{ "permission": "allow" }'
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo '{ "permission": "allow" }'
  exit 0
fi

staged_files="$(git diff --cached --name-only 2>/dev/null || true)"

if [[ -z "$staged_files" ]]; then
  echo '{ "permission": "allow" }'
  exit 0
fi

has_changeset=false
if printf '%s\n' "$staged_files" | grep -qE '^\.changeset/.*\.md$'; then
  has_changeset=true
fi

# Packages/apps that participate in versioning: everything under packages/
# except tooling (internal-only config, not consumer-facing), plus apps/web.
touches_versioned_code=false
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if [[ "$file" == packages/* && "$file" != packages/tooling/* ]]; then
    touches_versioned_code=true
    break
  fi
  if [[ "$file" == apps/web/* ]]; then
    touches_versioned_code=true
    break
  fi
done <<< "$staged_files"

if [[ "$touches_versioned_code" == true && "$has_changeset" == false ]]; then
  cat <<'JSON'
{
  "permission": "ask",
  "user_message": "This commit changes a versioned package or the web app but has no .changeset/*.md file staged. Run `pnpm changeset` first if this change should be released, or continue if it's internal-only (docs, tests, tooling).",
  "agent_message": "The changeset-reminder hook detected staged changes under a versioned package or apps/web with no new .changeset/*.md file staged. Consider running `pnpm changeset` to describe the change before committing, unless it is intentionally excluded from release notes."
}
JSON
  exit 0
fi

echo '{ "permission": "allow" }'
