import { extendBaseEnv } from '@kayebuilt/core-config';
import { z } from 'zod';

/**
 * core-auth's own env needs, layered on top of core-config's baseEnvSchema
 * (which already requires DATABASE_URL). Apps merge this into their own
 * schema rather than re-declaring these fields.
 */
export const authEnvSchema = extendBaseEnv({
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;
