---
name: adr
description: Scaffold a new Architecture Decision Record in this repo's docs/adr/, using platform's MADR template and the next available number. Use whenever a cross-package or hard-to-reverse decision is being made or has just been made.
---

Takes an optional argument: a short title for the decision (e.g. `/adr use resend for transactional email`). If no argument is given, ask for a one-line description of the decision before proceeding.

## What to do

1. List `docs/adr/*.md` in this repo, find the highest `000N` prefix, and use `N+1` (zero-padded to 4 digits) as the new ADR's number. If `docs/adr/` doesn't exist yet or has no numbered files, start at `0001`.
2. Read `~/dev/kayebuilt/platform/docs/standards/adr-template.md` and copy its structure exactly (Status, Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Consequences, Links).
3. Fill in the template using the decision described in the invocation (or what the user just told you). Set `Status: provisional — pending Jason confirmation` unless the user explicitly says this is already confirmed/final.
4. Write it to `docs/adr/000N-<kebab-case-title>.md`.
5. If this repo has a `DECISIONS-PENDING.md`, add a one-line entry there pointing at the new ADR (title + file path) so it shows up in the repo's running list of things awaiting Jason's confirmation.
6. Report the file path back and remind that it should be linked from the PR that implements the decision, once one exists.

Don't invent a decision that wasn't actually made in this conversation — if it's unclear what the decision even is, ask before scaffolding a file with made-up content.
