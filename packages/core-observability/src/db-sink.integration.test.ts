import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withTestDb } from '@kayebuilt/core-db';
import { describe, expect, it } from 'vitest';
import { writeAuditLog } from './audit.js';
import { DbAuditSink } from './db-sink.js';
import { auditLog } from './schema.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(dirname, '../migrations');

describe('DbAuditSink', () => {
  it('persists audit entries to a real Postgres audit_log table, queryable by tenant', async () => {
    const { db, cleanup } = await withTestDb({ migrationsFolder });
    try {
      const sink = new DbAuditSink(db);
      await writeAuditLog(sink, {
        tenantId: 'tenant-a',
        actorId: 'user-1',
        action: 'budget_line.update',
        targetType: 'budget_line',
        targetId: 'bl-123',
        metadata: { from: 1000, to: 1200 },
      });
      await writeAuditLog(sink, {
        tenantId: 'tenant-b',
        actorId: 'user-2',
        action: 'budget_line.update',
        targetType: 'budget_line',
        targetId: 'bl-999',
      });

      const rows = await db.select().from(auditLog);
      expect(rows).toHaveLength(2);

      const tenantARows = rows.filter(
        (r: typeof auditLog.$inferSelect) => r.tenantId === 'tenant-a',
      );
      expect(tenantARows).toHaveLength(1);
      expect(tenantARows[0]?.action).toBe('budget_line.update');
      expect(tenantARows[0]?.metadata).toEqual({ from: 1000, to: 1200 });
    } finally {
      await cleanup();
    }
  }, 60_000);
});
