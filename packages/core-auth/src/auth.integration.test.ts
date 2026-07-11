import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withTestDb } from '@kayebuilt/core-db';
import { describe, expect, it } from 'vitest';
import { authSchema } from './__fixtures__/auth-schema.js';
import { createAuth } from './auth.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(dirname, '__fixtures__/migrations');

const testEnv = {
  NODE_ENV: 'test' as const,
  DATABASE_URL: 'postgres://placeholder-not-read-directly', // db is injected pre-connected; drizzleAdapter doesn't re-read this
  REDIS_URL: 'redis://localhost:6379',
  LOG_LEVEL: 'silent' as const,
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
};

describe('createAuth', () => {
  it('constructs against a real Postgres connection and its internal context resolves', async () => {
    const { db, cleanup } = await withTestDb();
    try {
      const auth = createAuth({ db, env: testEnv, schema: authSchema });
      expect(auth.api).toBeDefined();
      // $Infer is a type-only marker (see Auth<Options> in better-auth's
      // types/auth.d.ts) — it has no runtime value, so the meaningful check
      // here is that the adapter/context actually initializes against a
      // real connection, not that some object shape "looks right".
      await expect(auth.$context).resolves.toBeDefined();
    } finally {
      await cleanup();
    }
  }, 30_000);

  it('signs a user up against a real, migrated Postgres schema', async () => {
    const { db, cleanup } = await withTestDb({ migrationsFolder });
    try {
      // better-auth's programmatic `getMigrations`/`runMigrations` only
      // supports the kysely adapter ("Only kysely adapter is supported for
      // migrations") — with the drizzle adapter, apps are expected to
      // generate + own their schema via `npx @better-auth/cli generate` and
      // migrate it themselves (see auth.ts's `CreateAuthOptions.schema` doc
      // comment). This test's fixture (__fixtures__/auth-schema.ts +
      // __fixtures__/migrations/) stands in for that app-owned schema.
      const auth = createAuth({ db, env: testEnv, schema: authSchema });

      const result = await auth.api.signUpEmail({
        body: {
          email: 'jason@kayebuilt.com',
          password: 'correct horse battery staple',
          name: 'Jason Kaye',
        },
      });

      expect(result.user.email).toBe('jason@kayebuilt.com');
    } finally {
      await cleanup();
    }
  }, 60_000);
});
