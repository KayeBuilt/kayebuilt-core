import { randomUUID } from 'node:crypto';
import type { TestDbHandle } from '@kayebuilt/core-db';
import { sql } from 'drizzle-orm';
import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { quoteIdent } from './ident.js';
import { runAsTenant } from './rls.js';

const APP_ROLE = 'app_user';
const APP_ROLE_PASSWORD = 'app_user_test_password';

export interface RlsTestDbHandle<TSchema extends Record<string, unknown>> {
  /** Unprivileged connection — every RLS assertion must query through this, never through `testDb`'s superuser connection. */
  appDb: PostgresJsDatabase<TSchema>;
  appClient: postgres.Sql;
  cleanup: () => Promise<void>;
}

/**
 * Testcontainers' Postgres connects as the `postgres` superuser, and
 * superusers (along with a table's owner, which the superuser also is here)
 * bypass RLS even with `FORCE ROW LEVEL SECURITY` — a real Postgres
 * attribute (`BYPASSRLS`), not a testcontainers quirk. Asserting isolation
 * through that connection would pass even with a missing or broken policy,
 * since RLS simply never engages for it.
 *
 * This creates a dedicated `app_user` role with `NOBYPASSRLS`, grants it
 * DML on the given tables, and returns a second client authenticated as
 * that role — mirroring how a production app's runtime connection must
 * also be a non-superuser, non-BYPASSRLS role for its RLS policies to mean
 * anything.
 */
export async function withRlsTestDb<TSchema extends Record<string, unknown>>(
  testDb: Pick<TestDbHandle<TSchema>, 'client' | 'connectionString'>,
  options: { grantTables: string[] },
): Promise<RlsTestDbHandle<TSchema>> {
  await testDb.client.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_ROLE}') THEN
        CREATE ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_ROLE_PASSWORD}' NOBYPASSRLS;
      END IF;
    END
    $$;
  `);
  await testDb.client.unsafe(`GRANT USAGE ON SCHEMA public TO ${APP_ROLE};`);
  for (const table of options.grantTables) {
    await testDb.client.unsafe(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ${quoteIdent(table)} TO ${APP_ROLE};`,
    );
  }

  const url = new URL(testDb.connectionString);
  url.username = APP_ROLE;
  url.password = APP_ROLE_PASSWORD;
  const appClient = postgres(url.toString(), { max: 5 });
  const appDb = drizzle(appClient) as PostgresJsDatabase<TSchema>;

  return {
    appDb,
    appClient,
    cleanup: () => appClient.end({ timeout: 5 }),
  };
}

export interface TenantIsolationCheck<TSchema extends Record<string, unknown>> {
  /** The unprivileged (`NOBYPASSRLS`) connection from `withRlsTestDb` — using the superuser connection here would make this check pass unconditionally. */
  appDb: PostgresJsDatabase<TSchema>;
  table: string;
  /** Defaults to "tenant_id" (matches `tenantColumns()` / `rlsPolicy()`). */
  tenantColumn?: string;
  /**
   * Inserts exactly one row scoped to the given tenant id. Receives the
   * *unprivileged* `appDb` already running inside that tenant's
   * `runAsTenant` transaction, so the seed insert itself is also subject to
   * the policy's `WITH CHECK` clause — proving new rows can't be written
   * under the wrong tenant either, not just that reads are scoped.
   */
  seed: (tx: PostgresJsDatabase<TSchema>, tenantId: string) => Promise<void>;
}

/**
 * The adversarial tenant-isolation pattern every RLS-backed table's
 * integration test runs: seed one row each for two distinct tenants, then
 * assert that querying as tenant A never surfaces tenant B's row (and vice
 * versa). Throws with a descriptive message on violation, so it's usable
 * from any test runner's `it(...)` block without a hard dependency on a
 * specific assertion library.
 */
export async function expectTenantIsolation<TSchema extends Record<string, unknown>>(
  check: TenantIsolationCheck<TSchema>,
): Promise<void> {
  const tenantColumn = check.tenantColumn ?? 'tenant_id';
  const tenantA = randomUUID();
  const tenantB = randomUUID();

  await runAsTenant(check.appDb, tenantA, (tx) => check.seed(tx, tenantA));
  await runAsTenant(check.appDb, tenantB, (tx) => check.seed(tx, tenantB));

  const rowsForA = await runAsTenant(check.appDb, tenantA, (tx) =>
    tx.execute(sql.raw(`SELECT ${quoteIdent(tenantColumn)} FROM ${quoteIdent(check.table)}`)),
  );
  const rowsForB = await runAsTenant(check.appDb, tenantB, (tx) =>
    tx.execute(sql.raw(`SELECT ${quoteIdent(tenantColumn)} FROM ${quoteIdent(check.table)}`)),
  );

  // biome-ignore lint/suspicious/noExplicitAny: rows come back as untyped query-result records
  const asStrings = (rows: any[]) => rows.map((row) => String(row[tenantColumn]));

  if (asStrings(rowsForA).some((id) => id !== tenantA)) {
    throw new Error(
      `Tenant isolation violated on "${check.table}": tenant ${tenantA} saw a row belonging to another tenant.`,
    );
  }
  if (asStrings(rowsForB).some((id) => id !== tenantB)) {
    throw new Error(
      `Tenant isolation violated on "${check.table}": tenant ${tenantB} saw a row belonging to another tenant.`,
    );
  }
  if (rowsForA.length === 0 || rowsForB.length === 0) {
    throw new Error(
      `Tenant isolation check on "${check.table}" saw zero rows for its own tenant — the policy (or seed) is likely broken, not just "isolated".`,
    );
  }
}
