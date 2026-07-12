# STATE.md — core

Last updated: 2026-07-12 (E1 complete and pushed; two bugfixes landed while building E3)

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

Pushed to `github.com/KayeBuilt/kayebuilt-core` (transferred from a personal-account repo into the `kayebuilt` org so `.github/workflows/ci.yml` can call `kayebuilt-platform`'s reusable workflows cross-repo — GitHub doesn't allow that between two repos owned by the same *personal* account, only within an org).

### Bugfixes landed after E1, discovered while building app-template's E3 walking skeleton

Found by actually running the app end-to-end (not caught by tsc/lint/unit tests) — see `DECISIONS-PENDING.md` for full reasoning:

1. `core-tenancy`'s `tenantColumns()` was `uuid`, changed to `text` — tenant ids are better-auth's `organization.id`, which are opaque strings, not UUIDs.
2. `core-ui`'s `ThemeProvider`, `DataTable`, and the recharts wrappers needed `'use client'` for Next.js App Router (React Server Components).
3. `core-auth`'s `createAuth()` had no `trustedOrigins` option, so a legitimate cross-origin web client (different port than the API) was rejected with "Invalid origin".

## Next

- Verify CI is green now that this repo and `platform` both live under the `kayebuilt` org.
- E3: finish `app-template` (docker-compose.prod.yml, Dockerfiles, eject script, Playwright e2e, HANDOFF docs), then push it.
- E4, E5.

## Judgment calls / things worth knowing

See `DECISIONS-PENDING.md` for the full list (core-auth role hierarchy, core-observability's dual audit sinks, core-tenancy's RLS test-role setup, the two bugfixes above).
