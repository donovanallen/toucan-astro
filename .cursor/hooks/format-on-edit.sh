#!/usr/bin/env bash
# afterFileEdit hook: auto-format the file the agent just wrote/edited.
#
# This is the Cursor-native analogue of cams-web-client's husky
# pre-commit `lint-staged` step (which runs Prettier/ESLint --fix on
# staged files before every commit) — instead of a git hook that only
# fires at commit time, this formats files as the agent edits them.
# Never blocks the edit (failClosed: false in hooks.json): formatting
# failures are logged and swallowed so a missing devDependency or a
# file outside any tsconfig never breaks the agent's flow.
set -euo pipefail

input="$(cat)"

extract_path() {
  local field="$1"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r --arg f "$field" '.[$f] // empty' 2>/dev/null
  else
    printf '%s' "$input" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('$field') or '')" 2>/dev/null
  fi
}

file_path=""
for field in file_path path filePath file; do
  file_path="$(extract_path "$field")"
  [[ -n "$file_path" ]] && break
done

if [[ -z "$file_path" || ! -f "$file_path" ]]; then
  exit 0
fi

case "$file_path" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs | *.json | *.md | *.mdx | *.css | *.yml | *.yaml)
    ;;
  *)
    exit 0
    ;;
esac

# Skip generated/vendored content even if it slips past .prettierignore
# (e.g. Prisma's generated client, which is gitignored but can exist
# on disk during a session).
case "$file_path" in
  */generated/* | */node_modules/* | */.next/* | */dist/* | */build/*)
    exit 0
    ;;
esac

if command -v pnpm >/dev/null 2>&1; then
  pnpm exec prettier --write --log-level warn "$file_path" >/dev/null 2>&1 || true
elif command -v npx >/dev/null 2>&1; then
  npx --no-install prettier --write --log-level warn "$file_path" >/dev/null 2>&1 || true
fi

exit 0
