# Use Render over Railway for API/worker container hosting

- Status: accepted
- Date: 2026-07-14

## Context and Problem Statement

ADR-0001 provisionally picked Railway for `apps/api`/`apps/worker` container hosting, but was never actually wired (no account existed). Jason has since stood up `permit-flow` under the `kayebuilt` org on Vercel (web) + Render (background worker) + Neon (Postgres), and it's already deployed live. He wants every app in the fleet — `app-template` and `construction-pm` first — to standardize on that same stack rather than carry two hosting providers for the same role.

## Decision Drivers

- Consistency: one BE host across the whole fleet is one less thing to relearn/re-credential per app.
- `permit-flow` is a working reference: real Dockerfile-based Render worker service, real Vercel Next.js deploy, real Neon Postgres — proven, not theoretical.
- Same decision drivers as ADR-0001 still apply (flat low pricing, minimal ops surface, solo operator) — Render satisfies these as well as Railway did; this is a lateral move for consistency, not a reversal of the original reasoning.

## Considered Options

- Railway (ADR-0001's original pick, never wired)
- Render (already in production for `permit-flow`)
- Fly.io

## Decision Outcome

Chosen option: "Render". `apps/api` and `apps/worker` deploy as Render services (Docker runtime, one `render.yaml` blueprint per repo — see `construction-pm/render.yaml` and `app-template/render.yaml`), reusing the same Dockerfiles built for the E3 self-host target. `apps/web` still deploys to Vercel, unchanged. Neon stays the Postgres choice (ADR-0002, unaffected by this change).

Supersedes ADR-0001: Railway is no longer the target. `preview.yml`/`deploy.yml` in `platform` are updated to reference Render instead of Railway, still stubbed pending real accounts/secrets (see `HUMAN-TODO.md`).

### Consequences

- Good, because it matches a stack that's already proven live in production (`permit-flow`), not a fresh unknown.
- Good, because Render's Blueprint (`render.yaml`) model checks into the repo, versioned alongside the code it deploys — same spirit as the rest of this fleet's config-as-code approach.
- Neutral, because this doesn't change the ejectability story: apps still only depend on `DATABASE_URL`/`REDIS_URL`/etc., no Render-specific APIs in application code.
- Bad, because any `permit-flow`-specific env/service names elsewhere are not carried over automatically — each app's `render.yaml` still needs services named for itself.

## Links

- Supersedes ADR-0001 (Railway over Fly.io)
- Relates to ADR-0002 (Neon), unaffected
- See `core/DECISIONS-PENDING.md`
