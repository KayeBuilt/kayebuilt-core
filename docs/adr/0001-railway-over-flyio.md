# Use Railway over Fly.io for API/worker container hosting

- Status: **superseded by ADR-0006** (2026-07-14) — Jason standardized on Render instead, matching the already-deployed `permit-flow` project. Kept below for historical context.
- Date: 2026-07-11

## Context and Problem Statement

Phase 0 needs a deploy target for `apps/api` and `apps/worker` containers (Next.js `apps/web` goes to Vercel separately). PROJECT-CONTEXT.md §3 names Railway as the provisional default. This ADR records the adoption so it's visible and revisitable, not so it re-litigates the choice.

## Decision Drivers

- Flat low pricing target (~$0/$29/$49 tiers, no per-user infra assumptions) — needs a host with a workable free/cheap tier for containers + background workers.
- Minimal ops surface — Jason is running this solo alongside an actual construction business; PaaS-simple beats self-managed Kubernetes/Nomad.
- Needs to support Postgres/Redis-adjacent container workloads (BullMQ worker) without bespoke infra work.

## Considered Options

- Railway
- Fly.io
- Render

## Decision Outcome

Chosen option: "Railway", adopted provisionally per PROJECT-CONTEXT.md §3. `preview.yml`/`deploy.yml` in `platform` are stubbed with Railway named as the target but not yet wired (needs an account — see `HUMAN-TODO.md`).

### Consequences

- Good, because Railway's PR-environment model maps cleanly onto the preview workflow's intended per-PR deploy.
- Bad, because Railway is a smaller company than Fly.io with less track record; revisit if pricing or reliability becomes an issue post-pilot.
- Ejectability: apps must not depend on Railway-specific env vars/APIs directly — containers just need `DATABASE_URL`/`REDIS_URL`/etc., so switching hosts later is a redeploy, not a code change.

## Links

- Relates to PROJECT-CONTEXT.md §3
- See `core/DECISIONS-PENDING.md`
