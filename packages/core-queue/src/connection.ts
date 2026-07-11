import { Redis } from 'ioredis';

export interface QueueEnv {
  REDIS_URL: string;
}

/**
 * BullMQ requires `maxRetriesPerRequest: null` on the ioredis connection it's
 * handed, or Queue/Worker construction throws — every caller building a
 * connection for BullMQ should go through here rather than `new Redis()`
 * directly. `REDIS_URL` is already part of `@kayebuilt/core-config`'s
 * `baseEnvSchema`, so any app's parsed env satisfies `QueueEnv` as-is.
 */
export function createQueueConnection(env: QueueEnv): Redis {
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
