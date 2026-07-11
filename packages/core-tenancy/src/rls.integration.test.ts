import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withTestDb } from '@kayebuilt/core-db';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rlsPolicy } from './rls.js';
import { type RlsTestDbHandle, expectTenantIsolation, withRlsTestDb } from './testing.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(dirname, '__fixtures__/migrations');

describe('RLS adversarial isolation', () => {
  let superuserDb: Awaited<ReturnType<typeof withTestDb>>;
  let rlsDb: RlsTestDbHandle<Record<string, never>>;

  beforeAll(async () => {
    superuserDb = await withTestDb({ migrationsFolder });
    await superuserDb.client.unsafe(rlsPolicy('notes'));
    rlsDb = await withRlsTestDb(superuserDb, { grantTables: ['notes'] });
  }, 60_000);

  afterAll(async () => {
    await rlsDb.cleanup();
    await superuserDb.cleanup();
  });

  it("never lets one tenant see another tenant's rows, through the unprivileged connection", async () => {
    await expectTenantIsolation({
      appDb: rlsDb.appDb,
      table: 'notes',
      seed: async (tx, tenantId) => {
        await tx.execute(
          sql`INSERT INTO notes (tenant_id, message) VALUES (${tenantId}::uuid, 'hello')`,
        );
      },
    });
  }, 30_000);

  it('sanity check: the superuser connection bypasses RLS (this is why tests must use appDb, not client)', async () => {
    const rows = await superuserDb.db.execute(sql`SELECT count(*)::int AS count FROM notes`);
    // biome-ignore lint/suspicious/noExplicitAny: raw query result row
    expect((rows[0] as any).count).toBeGreaterThanOrEqual(2);
  }, 30_000);
});
