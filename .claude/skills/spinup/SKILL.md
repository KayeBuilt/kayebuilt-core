---
name: spinup
description: Cold-start a session in this repo - print the read order, actually read those docs, run the test suite, and report drift between what STATE.md claims and what's actually true. Use at the start of any session, especially a fresh one with zero prior context.
---

Run this whenever a session in this repo starts cold (no prior context in this conversation), or when explicitly asked to "spin up" / "get oriented."

## What to do, in order

1. **Read, in this exact order, and hold what you read:**
   1. `~/dev/kayebuilt/docs/PROJECT-CONTEXT.md` — durable, cross-repo context. If this file is missing, STOP and say so; don't proceed from memory.
   2. `CLAUDE.md` at this repo's root.
   3. `docs/memory/STATE.md`.
   4. Every file in `docs/memory/workstreams/` other than `README.md`, if any exist yet (Phase 0: usually none — that's fine, note it and move on).
   5. This repo's `DECISIONS-PENDING.md`.
   6. The relevant contract for whatever the user is about to ask for — `packages/domain`'s drizzle schema + zod contracts in this repo, or a package's own exported types in `core`.

2. **Run the real verification, not a guess:**
   - `pnpm turbo run build test lint typecheck`
   - If this repo has integration tests and Docker is available, also `pnpm turbo run test:integration`.
   - Note pass/fail per task, not just an overall summary.

3. **Report drift.** Compare what `STATE.md`'s "Status" and "Next" sections claim against what you just observed:
   - Something STATE.md says is "done" but a test/build step just failed → flag it explicitly, don't silently trust the doc.
   - Something STATE.md lists under "Next" that's already done in the code → flag that too (memory rot in the other direction).
   - Uncommitted changes in `git status` that STATE.md doesn't mention → flag as possible in-progress work from an interrupted session.

4. **Report back in this shape**, under 15 lines:
   - One line: what this repo is (from CLAUDE.md).
   - 2-4 lines: current status per STATE.md, confirmed or corrected by what you just ran.
   - 1-2 lines: exactly what's next.
   - Any drift found (or "no drift found").

Don't ask permission to do steps 1-3 — just do them and report. Only stop and ask if a core file (`PROJECT-CONTEXT.md`, this repo's `CLAUDE.md`, or `STATE.md`) is missing entirely, since that means this isn't a normal resume and guessing would be worse than asking.
