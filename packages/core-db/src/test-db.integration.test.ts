import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { withTestDb } from './test-db.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(dirname, '__fixtures__/migrations');

describe('withTestDb', () => {
  it('starts a real Postgres container, runs migrations, and executes queries', async () => {
    const { db, cleanup } = await withTestDb({ migrationsFolder });
    try {
      await db.execute(sql`INSERT INTO ping (message) VALUES ('hello')`);
      const rows = await db.execute(sql`SELECT message FROM ping`);
      expect(rows.length).toBe(1);
      expect(rows[0]?.message).toBe('hello');
    } finally {
      await cleanup();
    }
  }, 60_000);
});
