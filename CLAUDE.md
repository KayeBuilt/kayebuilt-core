# CLAUDE.md — core

Read order for any session in this repo: `~/dev/kayebuilt/docs/PROJECT-CONTEXT.md` (durable, cross-repo context) → this file → `docs/memory/STATE.md` (current status) → the specific package you're touching.

## What this repo is

`@kayebuilt/core-*` — public (MIT), npm-published packages every app in the fleet depends on: `core-config`, `core-db`, `core-tenancy`, `core-auth`, `core-queue`, `core-observability`, `core-ui`. This is the "shared spine" — changes here are fleet-wide, not local to one app.

## Conventions (see `platform/docs/standards/conventions.md` for the full fleet-wide version)

- Every package: `package.json` (type: module, exports → `dist`, scripts `build`/`test`/`test:integration`?/`lint`/`typecheck`), `tsconfig.json` (extends `../../tsconfig.base.json`), Vitest, Biome.
- Real tests only — no mocked Postgres/Redis. Integration tests (`*.integration.test.ts`) use `core-db`'s `withTestDb()` (Postgres) or a local testcontainers Redis helper (see `core-queue`), never a shared/leaked container.
- Build order matters: `core-config` and `core-db` have no internal dependencies and build first; `core-auth`, `core-queue`, `core-observability` depend on one or both. Always `pnpm turbo run build` (respects the dependency graph) rather than building a single package in isolation when verifying a dependent.
- `pnpm audit --audit-level=high` must stay clean — see the version pins in each package.json for hard-won reasons (e.g. `core-queue`'s exact `ioredis` pin matches `bullmq`'s own, or you get duplicate-type resolution errors).

## Rules

- New tenant-owned table anywhere downstream → must use `core-tenancy`'s `tenantColumns()` + `rlsPolicy()`, and its integration test must call `expectTenantIsolation()`. No exceptions.
- Third-party services (Sentry, Resend, etc.) are only ever reachable through a `core-*` interface with a true no-op fallback — see `core-observability`'s `initSentry()` for the pattern (never touches the network without a DSN).
- Provisional decisions (Railway, Neon, Biome, Resend/Mailer, coverage gates) are recorded in `docs/adr/0001`–`0005` and listed in `DECISIONS-PENDING.md` — don't silently re-decide these, and don't silently accept them as final either; they're waiting on Jason.

## Package-specific notes worth knowing before you touch them

- **core-auth**: better-auth's programmatic `getMigrations`/`runMigrations` only supports the kysely adapter, not drizzle. Apps generate their own better-auth schema via `npx @better-auth/cli generate` and own the migration — `createAuth()` accepts a `schema` param for exactly this. See `packages/core-auth/src/__fixtures__/` for a minimal worked example (email/password core tables only).
- **core-queue**: BullMQ queue names cannot contain `:` (Redis key-delimiter reserved character) — the dead-letter queue naming is `${name}-dead`, not `${name}:dead`.
- **core-observability**: ships two `AuditSink` implementations — `LogAuditSink` (zero-dependency, writes through pino) and `DbAuditSink` (persists to a Postgres `audit_log` table this package owns and migrates). Production apps should wire `DbAuditSink`.
