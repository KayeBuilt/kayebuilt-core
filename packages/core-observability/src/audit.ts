import type { Logger } from './logger.js';

export interface AuditLogEntry {
  tenantId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface AuditSink {
  write(entry: AuditLogEntry): Promise<void>;
}

/**
 * Default sink: writes structured audit entries through the shared pino
 * logger. A Postgres-backed AuditSink (an `audit_log` table) is future work
 * for app-template — core-observability intentionally has no dependency on
 * core-db so every app can choose its own audit storage.
 */
export class LogAuditSink implements AuditSink {
  constructor(private readonly logger: Logger) {}

  async write(entry: AuditLogEntry): Promise<void> {
    this.logger.info(
      { audit: true, ...entry, timestamp: entry.timestamp ?? new Date().toISOString() },
      'audit_log',
    );
  }
}

export async function writeAuditLog(sink: AuditSink, entry: AuditLogEntry): Promise<void> {
  await sink.write(entry);
}
