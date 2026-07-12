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

## CI: what actually broke, in order discovered (the visible symptom was misleading each time)

`core`'s CI (`.github/workflows/ci.yml`, calling `platform`'s reusable workflows) failed with GitHub's generic "workflow file issue" / `startup_failure` for a long stretch. Every plausible-sounding cause was tried and ruled out before finding the real one — logged here so nobody re-diagnoses this from scratch:

1. **Not actually the cause, but tried first**: cross-repo private reusable-workflow access. Set `kayebuilt-platform`'s `actions/permissions/access` to `user`, then `organization`, then transferred both repos into the `kayebuilt` GitHub org entirely. None of this was the fix (though moving to the org was the right structural move anyway, and is required for cross-repo calls to work *at all* between two repos owned by the same *personal* account — GitHub has no equivalent setting for that case).
2. **The actual root cause**: `platform`'s `security.yml` had a `codeql` job requesting `permissions: security-events: write`. GitHub Code Scanning (CodeQL) requires GitHub Advanced Security, not available for private repos on the Free plan — requesting that permission without GHAS makes the **entire calling workflow** fail to even start (a pre-flight check across all jobs in the caller, not a job-level failure), which is exactly the symptom that looked like a cross-repo access problem. Fixed by dropping the `codeql` job (see platform's own `DECISIONS-PENDING.md`).
3. Two more real bugs surfaced once jobs actually started running: `pnpm/action-setup@v4` was passed an explicit `version:` input *and* the repo's `package.json` pins `packageManager` — the action refuses to start when both are present ("Multiple versions of pnpm specified"). Fixed in `platform`'s `ci.yml`/`security.yml` and in `core`'s own `release.yml` by dropping the explicit version (the action reads `packageManager` directly). And `gitleaks/gitleaks-action@v2` now requires a paid `GITLEAKS_LICENSE` for non-public repos — swapped for calling the (still free/Apache-2.0) `gitleaks` CLI directly.
4. `handoff-readiness.yml`'s hardcoded-org-domain check correctly flagged `jason@kayebuilt.com` in two test fixtures (`core-auth/src/auth.integration.test.ts`, `core-config/src/mailer.test.ts`) — changed to `jason@example.com`.
5. `core-ui`'s `package.json` had a `test:integration` script copy-pasted from the template pattern but no actual `*.integration.test.ts` files — vitest exits 1 on an empty match, failing `turbo run test:integration` for a package that has nothing to integration-test. Dropped the script (matches `core-config`, which never had one).

CI is green end-to-end as of this fix (`ci`, `security/gitleaks`, `security/pnpm-audit`, `handoff-readiness`, and `release` all passing). `platform` is tagged `v1.2`.
