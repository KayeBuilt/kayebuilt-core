# Use Neon over Railway Postgres, with no Neon-only features in app code

- Status: provisional — pending Jason confirmation
- Date: 2026-07-11

## Context and Problem Statement

Even though Railway (ADR-0001) hosts the API/worker containers, Postgres itself is a separate provisional choice: Neon, specifically for its branch-per-preview model. PROJECT-CONTEXT.md §3 names this default; this ADR records the adoption.

## Decision Drivers

- `preview.yml`'s intended design is one ephemeral Postgres branch per PR, migrated and torn down automatically — Neon's branching is purpose-built for this, Railway's managed Postgres is not.
- Ejectability (PROJECT-CONTEXT.md §5): a client must be able to self-host on any Postgres, so the app layer can only use standard Postgres features — no Neon-specific SQL, extensions, or APIs in `packages/domain` or migrations.

## Considered Options

- Neon
- Railway's managed Postgres
- Supabase

## Decision Outcome

Chosen option: "Neon", adopted provisionally. Enforced via convention (code review / `handoff-readiness.yml` doesn't currently grep for this — worth adding if a Neon-only feature ever gets reached for) rather than a technical guardrail yet.

### Consequences

- Good, because branch-per-PR previews come essentially for free instead of custom teardown scripting.
- Bad, because it adds a second infra provider (beyond Railway) to the account/credential surface — logged in `HUMAN-TODO.md`.
- Local/CI dev always uses plain `postgres:16-alpine` in Docker/testcontainers (see `core-db`'s `withTestDb()`) — Neon is a preview/prod-only concern, never a hard dependency of the test suite.

## Links

- Relates to PROJECT-CONTEXT.md §3, §5
- Relates to ADR-0001 (Railway)
