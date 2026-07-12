---
name: handoff
description: Close out a session by summarizing what changed and updating docs/memory/STATE.md, the relevant workstream doc, and the root SESSION-LOG.md so a future session (or a fresh agent) can pick up cleanly with zero human re-briefing. Use at the end of a session with meaningful uncommitted or recently-committed progress.
---

## What to do

1. **Gather what actually changed**, don't guess from memory:
   - `git log --oneline` since `docs/memory/STATE.md`'s last-updated date (the file's own "Last updated:" line at the top).
   - `git diff` / `git status` for anything uncommitted.
2. **Summarize it** — what was built/fixed/decided, any real bugs found while verifying (this project's culture: bugs found by *running* things, not reading code, are worth recording explicitly since they're the reason "verify by running" is a rule here), and what's genuinely next.
3. **Update `docs/memory/STATE.md`**:
   - Bump the "Last updated" date.
   - Update the status table/section to reflect what's actually true now (confirmed by running things this session, not assumed).
   - Rewrite "Next" to be the real next unmet acceptance criterion or task, specific enough that a cold-start session doesn't have to reconstruct it.
4. **Update the relevant `docs/memory/workstreams/WS-*.md`** if this session's work belongs to a specific workstream (Phase 0: usually doesn't yet — skip if none exist).
5. **Append a dated entry to `~/dev/kayebuilt/SESSION-LOG.md`** (root of the workspace, not this repo) in the same style as existing entries: a `## YYYY-MM-DD — <short summary>` heading, a few bullet points of what happened (including real bugs found and how they were diagnosed, not just "fixed X"), and a "Next:" line.
6. **If anything came up that needs Jason** (money, accounts, access-control changes, anything PROJECT-CONTEXT.md §7 reserves for him) and isn't already logged, add it to `~/dev/kayebuilt/HUMAN-TODO.md` with exact next steps.
7. Report back a short confirmation of what was updated — don't just say "done," name the files.

This is about making memory accurate, not making it look good. If something didn't work, say so in STATE.md — a future session trusting a falsely-green STATE.md wastes more time than an honest red one.
