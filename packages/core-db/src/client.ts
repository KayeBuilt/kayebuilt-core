import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export interface DbEnv {
  DATABASE_URL: string;
}

export interface CreateDbOptions {
  /** Max connections in the pool. Defaults to 10; keep small per-process for serverless/container deploys. */
  max?: number;
}

export interface CreateDbResult<TSchema extends Record<string, unknown> = Record<string, never>> {
  db: PostgresJsDatabase<TSchema>;
  client: postgres.Sql;
  close: () => Promise<void>;
}

/**
 * Creates a drizzle client backed by postgres.js. Callers pass their own
 * drizzle schema object so `db.query.*` is fully typed; core-db stays
 * schema-agnostic so every app can own its own table definitions.
 */
export function createDb<TSchema extends Record<string, unknown> = Record<string, never>>(
  env: DbEnv,
  schema?: TSchema,
  options: CreateDbOptions = {},
): CreateDbResult<TSchema> {
  const client = postgres(env.DATABASE_URL, { max: options.max ?? 10 });
  const db = (
    schema ? drizzle(client, { schema }) : drizzle(client)
  ) as PostgresJsDatabase<TSchema>;
  return {
    db,
    client,
    close: () => client.end({ timeout: 5 }),
  };
}
