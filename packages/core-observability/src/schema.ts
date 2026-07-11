import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Owned by core-observability (not app domain code) because audit logging is
 * a cross-cutting platform concern, same reasoning as core-tenancy owning
 * `tenantColumns()`/`rlsPolicy()`. Apps run the migration in `migrations/`
 * as-is; they don't redefine this table.
 */
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').notNull(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
