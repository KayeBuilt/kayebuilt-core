#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): lint+typecheck just the package containing
# the file that was edited, via turbo's dependency-aware --filter. Reads the
# tool call's JSON payload from stdin (Claude Code's PostToolUse contract).
set -euo pipefail

payload="$(cat)"
file_path="$(echo "$payload" | jq -r '.tool_input.file_path // empty')"

[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
dir="$(dirname "$file_path")"
pkg_dir=""
while [ "$dir" != "$repo_root" ] && [ "$dir" != "/" ]; do
  if [ -f "$dir/package.json" ]; then
    pkg_dir="$dir"
    break
  fi
  dir="$(dirname "$dir")"
done

[ -z "$pkg_dir" ] && exit 0

pkg_name="$(jq -r '.name // empty' "$pkg_dir/package.json")"
[ -z "$pkg_name" ] && exit 0

cd "$repo_root"
echo "[lint-typecheck-changed] $pkg_name ($file_path)" >&2
pnpm turbo run lint typecheck --filter="$pkg_name" 2>&1 | tail -40 >&2 || true
exit 0
