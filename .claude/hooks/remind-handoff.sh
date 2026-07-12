#!/usr/bin/env bash
# Stop hook: if the session ends with uncommitted changes, remind to run
# /handoff instead of silently leaving STATE.md/SESSION-LOG stale.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

status="$(git status --porcelain 2>/dev/null || true)"
[ -z "$status" ] && exit 0

cat >&2 <<EOF
[remind-handoff] Uncommitted changes in $(basename "$repo_root"):
$(echo "$status" | head -10)

Run /handoff before ending this session so docs/memory/STATE.md and
SESSION-LOG.md reflect what actually changed.
EOF
exit 0
