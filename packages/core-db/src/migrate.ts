import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

/** Runs drizzle-kit-generated SQL migrations from `migrationsFolder` against `db`. Idempotent. */
export async function runMigrations(
  // biome-ignore lint/suspicious/noExplicitAny: schema shape is irrelevant to running raw migration files
  db: PostgresJsDatabase<any>,
  migrationsFolder: string,
): Promise<void> {
  await migrate(db, { migrationsFolder });
}
