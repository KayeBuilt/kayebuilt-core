import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { AuditLogEntry, AuditSink } from './audit.js';
import { auditLog } from './schema.js';

/**
 * Durable, queryable counterpart to LogAuditSink. A financial/construction-PM
 * app needs "show me every change to budget line X" as a query, not a log
 * grep — this is the sink app-template and construction-pm should wire in
 * production, with LogAuditSink kept as the zero-dependency default/fallback.
 */
export class DbAuditSink implements AuditSink {
  // biome-ignore lint/suspicious/noExplicitAny: caller's full schema type is irrelevant here, we only touch auditLog
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  async write(entry: AuditLogEntry): Promise<void> {
    await this.db.insert(auditLog).values({
      tenantId: entry.tenantId,
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata ?? null,
      ...(entry.timestamp ? { createdAt: new Date(entry.timestamp) } : {}),
    });
  }
}
