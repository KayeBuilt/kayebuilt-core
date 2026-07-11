import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { runMigrations } from './migrate.js';

export interface WithTestDbOptions<TSchema extends Record<string, unknown>> {
  schema?: TSchema;
  /** If provided, migrations run against the fresh container before the handle is returned. */
  migrationsFolder?: string;
}

export interface TestDbHandle<TSchema extends Record<string, unknown> = Record<string, never>> {
  db: PostgresJsDatabase<TSchema>;
  client: postgres.Sql;
  connectionString: string;
  container: StartedPostgreSqlContainer;
  cleanup: () => Promise<void>;
}

/**
 * Spins up a throwaway Postgres via testcontainers and returns a ready-to-use
 * drizzle client. Every downstream package's integration tests (RLS
 * isolation included) build on this instead of hand-rolling container setup.
 */
export async function withTestDb<TSchema extends Record<string, unknown> = Record<string, never>>(
  options: WithTestDbOptions<TSchema> = {},
): Promise<TestDbHandle<TSchema>> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const connectionString = container.getConnectionUri();
  const client = postgres(connectionString, { max: 5 });
  const db = (
    options.schema ? drizzle(client, { schema: options.schema }) : drizzle(client)
  ) as PostgresJsDatabase<TSchema>;

  if (options.migrationsFolder) {
    await runMigrations(db, options.migrationsFolder);
  }

  return {
    db,
    client,
    connectionString,
    container,
    cleanup: async () => {
      await client.end({ timeout: 5 });
      await container.stop();
    },
  };
}
