# STATE.md — core

Last updated: 2026-07-11 (E1 complete)

## Status

E1 (`core` monorepo scaffold) is **complete**. All 7 packages build/test/lint/typecheck green via `pnpm turbo run build test lint typecheck`:

| Package | Status |
|---|---|
| `core-config` | done — typed env (zod), feature flags, `Mailer` interface |
| `core-db` | done — drizzle client factory, migration runner, `withTestDb()` (testcontainers) |
| `core-tenancy` | done — `runAsTenant`, `tenantColumns()`, `rlsPolicy()`, fastify plugin, `expectTenantIsolation()` (adversarial RLS test utility, verified against a real Postgres testcontainer) |
| `core-auth` | done — better-auth (email/password + organizations plugin), `requireRole()` guard |
| `core-queue` | done — BullMQ wrapper (`defineJob`), dead-letter queue, verified against real Redis testcontainer |
| `core-observability` | done — pino logger, `initSentry()` (no-op without DSN), `LogAuditSink` + `DbAuditSink` |
| `core-ui` | done (thin, per plan) — `cn()`, `ThemeProvider`, Card/Table primitives, `DataTable` (tanstack table), `StatCard`, `LineChart`/`BarChart` (recharts) |

ADRs 0001–0005 written (provisional defaults from PROJECT-CONTEXT.md §3), logged in `DECISIONS-PENDING.md` pending Jason's confirmation.

`.github/workflows/ci.yml` calls `kayebuilt-platform`'s reusable workflows at `@v1` — **this repo's CI cannot go green until `platform` is pushed and tagged `v1`** (tracked as part of E2).

## Next

- Push this repo to `github.com/jaskaye17/kayebuilt-core` (private) and verify CI.
- E2: push `platform` (already committed locally, not yet pushed).
- E3: `app-template` walking skeleton.

## Judgment calls / things worth knowing

See `DECISIONS-PENDING.md` for the full list (core-auth role hierarchy, core-observability's dual audit sinks, core-tenancy's RLS test-role setup).
