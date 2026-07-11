import { z } from 'zod';

export class EnvValidationError extends Error {
  constructor(public readonly issues: z.ZodIssue[]) {
    const details = issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    super(`Invalid environment configuration:\n${details}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Parses `source` (defaults to process.env) against `schema`, throwing a
 * readable EnvValidationError that lists every failing key at once rather
 * than failing on the first bad var.
 */
export function loadEnv<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  source: Record<string, string | undefined> = process.env,
): z.infer<TSchema> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new EnvValidationError(result.error.issues);
  }
  return result.data;
}

/** Base env vars every KayeBuilt app needs, regardless of app-specific extensions. */
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

/** Merge the base schema with app-specific fields; apps call this instead of re-declaring the base fields. */
export function extendBaseEnv<TExtra extends z.ZodRawShape>(extra: TExtra) {
  return baseEnvSchema.extend(extra);
}
