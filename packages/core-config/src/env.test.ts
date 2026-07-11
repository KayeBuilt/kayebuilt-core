import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EnvValidationError, extendBaseEnv, loadEnv } from './env.js';

const schema = extendBaseEnv({
  API_PORT: z.coerce.number().default(3000),
});

describe('loadEnv', () => {
  it('parses a valid environment', () => {
    const env = loadEnv(schema, {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      API_PORT: '4000',
    });
    expect(env.API_PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('test');
  });

  it('applies defaults for optional keys', () => {
    const env = loadEnv(schema, {
      DATABASE_URL: 'postgres://localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
    });
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('throws EnvValidationError listing every missing/invalid key', () => {
    expect.assertions(2);
    try {
      loadEnv(schema, { DATABASE_URL: 'not-a-url' });
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
      const issues = (err as EnvValidationError).issues;
      expect(issues.length).toBeGreaterThanOrEqual(2); // bad DATABASE_URL + missing REDIS_URL
    }
  });
});
