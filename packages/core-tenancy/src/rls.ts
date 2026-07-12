import { sql } from 'drizzle-orm';
import { text } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { quoteIdent } from './ident.js';

/**
 * Drizzle column helper every tenant-scoped domain table spreads into its
 * schema definition, so the physical column name/type is identical
 * everywhere `rlsPolicy()` (and `expectTenantIsolation()`) expect it.
 *
 * Deliberately `text`, not `uuid`: the tenant id is `organization.id` from
 * core-auth's better-auth setup, and better-auth generates its own opaque
 * string ids (not UUIDs) for every table it owns, including `organization`.
 * A `uuid`-typed column would reject those at insert time — `text` accepts
 * both better-auth's ids and app-generated UUIDs equally.
 */
export function tenantColumns() {
  return {
    tenantId: text('tenant_id').notNull(),
  };
}

export interface RlsPolicyOptions {
  /** Physical column name holding the tenant id. Defaults to "tenant_id" (matches `tenantColumns()`). */
  tenantColumn?: string;
  /** Policy name. Defaults to "tenant_isolation". */
  policyName?: string;
}

/**
 * Generates the DDL that gives a table identical tenant-isolation semantics:
 * RLS enabled *and forced* (so the table owner is restricted too — by
 * default Postgres exempts owners from their own RLS policies, which would
 * silently defeat this for any connection using the migration-owning role),
 * plus a policy comparing the row's tenant column against the session's
 * `app.tenant_id` setting (set per-request via `runAsTenant`).
 *
 * `current_setting(..., true)` (missing_ok) returns NULL rather than raising
 * when no tenant context is set, so an un-scoped connection sees zero rows
 * instead of erroring — fail closed, not fail open.
 *
 * Returned as a raw SQL string for use in migration files (`CREATE POLICY`
 * doesn't support bound parameters, so this can't be a drizzle `sql` tag).
 */
export function rlsPolicy(tableName: string, options: RlsPolicyOptions = {}): string {
  const tenantColumn = options.tenantColumn ?? 'tenant_id';
  const policyName = options.policyName ?? 'tenant_isolation';
  const table = quoteIdent(tableName);
  const column = quoteIdent(tenantColumn);
  const policy = quoteIdent(policyName);

  return [
    `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`,
    `CREATE POLICY ${policy} ON ${table}`,
    `  USING (${column} = current_setting('app.tenant_id', true))`,
    `  WITH CHECK (${column} = current_setting('app.tenant_id', true));`,
  ].join('\n');
}

/**
 * Runs `fn` inside a transaction with `app.tenant_id` set for that
 * transaction's duration only (`set_config(..., true)` mirrors `SET LOCAL` —
 * it's used instead of a literal `SET LOCAL app.tenant_id = '...'` because
 * `set_config` accepts a normal bound parameter, so the tenant id can never
 * be SQL-injected via string interpolation). Every RLS policy created by
 * `rlsPolicy()` reads this setting, so any query run inside `fn` is
 * automatically scoped to `tenantId` — including by application code that
 * has no idea RLS is involved.
 *
 * The connection this is called on must NOT have the BYPASSRLS role
 * attribute (and should not own the tables it queries) — see
 * `./testing.ts` for why, and for the test-role setup that mirrors
 * production's non-superuser connection in testcontainers.
 */
export async function runAsTenant<TSchema extends Record<string, unknown>, T>(
  db: PostgresJsDatabase<TSchema>,
  tenantId: string,
  fn: (tx: PostgresJsDatabase<TSchema>) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx as unknown as PostgresJsDatabase<TSchema>);
  });
}
