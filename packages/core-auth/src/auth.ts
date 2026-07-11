import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import type { AuthEnv } from './env.js';

export interface CreateAuthOptions {
  env: AuthEnv;
  // biome-ignore lint/suspicious/noExplicitAny: better-auth's drizzleAdapter accepts any drizzle db shape; the schema is app-owned.
  db: any;
  /**
   * The drizzle table objects for better-auth's own tables (user, session,
   * account, verification, organization, member, invitation, ...), keyed by
   * better-auth's canonical model name. Apps generate this once via
   * `npx @better-auth/cli generate` (drizzle-adapter only supports the
   * kysely adapter for *programmatic* migration, so codegen + drizzle-kit
   * is the supported path) and own the resulting migration — core-auth
   * intentionally has no opinion on the physical schema beyond field names.
   */
  // biome-ignore lint/suspicious/noExplicitAny: drizzle table shape is app-owned; better-auth itself types this as Record<string, any>.
  schema?: Record<string, any>;
  /** Extra better-auth plugins an app wants layered on top of email/password + organization. */
  // biome-ignore lint/suspicious/noExplicitAny: plugin array element type is intentionally open per better-auth's own plugin API.
  extraPlugins?: any[];
}

/**
 * Configures better-auth with email/password + the organization plugin
 * (organization = tenant, per PROJECT-CONTEXT.md). Member roles are stored
 * as plain strings by better-auth; role *enforcement* is our own
 * `requireRole` guard (see require-role.ts), not better-auth's built-in
 * access-control plugin — that keeps this package's public surface small
 * and independent of better-auth's more version-sensitive AC API.
 */
export function createAuth(options: CreateAuthOptions) {
  const { env, db, schema, extraPlugins = [] } = options;

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      organization({
        creatorRole: 'owner',
      }),
      ...extraPlugins,
    ],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
