# Decisions pending Jason's confirmation — core

Provisional defaults adopted from `PROJECT-CONTEXT.md` §3, each recorded as an ADR marked `status: provisional — pending Jason confirmation` in `docs/adr/`:

| ADR | Decision | File |
|---|---|---|
| 0001 | Railway over Fly.io (API/worker container hosting) | `docs/adr/0001-railway-over-flyio.md` |
| 0002 | Neon over Railway Postgres (branch-per-preview; no Neon-only features in app code) | `docs/adr/0002-neon-over-railway-postgres.md` |
| 0003 | Biome over eslint+prettier | `docs/adr/0003-biome-over-eslint-prettier.md` |
| 0004 | Resend behind the `Mailer` interface | `docs/adr/0004-resend-behind-mailer-interface.md` |
| 0005 | Coverage gates: 85% domain / 70% overall (policy set now, enforcement deferred to first domain package) | `docs/adr/0005-coverage-gates.md` |

Confirm, amend, or reject each — flip `status:` to `accepted` (or superseded) once decided. None of these block E1–E5; they're logged so Phase 1 doesn't inherit silent assumptions.

## Additional judgment calls made during E1 (not full ADRs, flagged here for visibility)

- **`core-auth` role hierarchy**: `requireRole(min)` treats the five roles (`owner > pm > accounting > field > readonly`) as linearly ordered, so `requireRole('pm')` also admits `'owner'`. Non-hierarchical checks (e.g. "accounting can X but PM can't") should compare `role === 'accounting'` directly instead of using `requireRole`. Reasonable default, not specified in PROJECT-CONTEXT — worth a quick confirm.
- **`core-observability`'s audit log**: ships both a zero-dependency `LogAuditSink` (writes through pino) and a `DbAuditSink` (persists to a `audit_log` Postgres table this package owns, migration in `packages/core-observability/migrations/`). Apps should wire `DbAuditSink` in production — a financial/construction-PM app needs queryable audit history, not just log lines.
- **`core-tenancy`'s RLS test setup**: see its own notes for how the adversarial isolation test avoids the Postgres-superuser-bypasses-RLS trap in testcontainers.
- **`core-tenancy`'s `tenantColumns()` is `text`, not `uuid`** (fixed during E3, after running the app-template walking skeleton end-to-end against real better-auth organizations): tenant ids are `organization.id` from core-auth, and better-auth generates its own opaque string ids for every table it owns — not UUIDs. A `uuid`-typed tenant column rejected them at insert time. `text` accepts both better-auth's ids and app-generated UUIDs. `rlsPolicy()`'s generated policy DDL dropped its `::uuid` cast to match.
