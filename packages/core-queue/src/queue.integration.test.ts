import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestRedisHandle, withTestRedis } from './__tests__/redis-container.js';
import { defineJob } from './job.js';

async function waitFor(check: () => boolean | Promise<boolean>, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}

describe('core-queue integration', () => {
  let redis: TestRedisHandle;

  beforeAll(async () => {
    redis = await withTestRedis();
  }, 60_000);

  afterAll(async () => {
    await redis.cleanup();
  });

  it('processes a job through a real worker', async () => {
    const processed: string[] = [];
    const job = defineJob<{ message: string }>('process-note', async (payload) => {
      processed.push(payload.message);
    });

    const queueConnection = redis.connection.duplicate();
    const workerConnection = redis.connection.duplicate();
    const queue = job.createQueue(queueConnection);
    const { worker, deadLetterQueue } = job.createWorker(workerConnection);

    try {
      await job.enqueue(queue, { message: 'hello world' });
      await waitFor(() => processed.includes('hello world'));
      expect(processed).toEqual(['hello world']);
    } finally {
      await worker.close();
      await deadLetterQueue.close();
      await queue.close();
      queueConnection.disconnect();
      workerConnection.disconnect();
    }
  }, 30_000);

  it('moves a job that exhausts its retries into the dead-letter queue', async () => {
    const job = defineJob<{ willFail: true }>(
      'always-fails',
      async () => {
        throw new Error('simulated permanent failure');
      },
      { retry: { attempts: 2, backoff: { type: 'fixed', delay: 10 } } },
    );

    const queueConnection = redis.connection.duplicate();
    const workerConnection = redis.connection.duplicate();
    const queue = job.createQueue(queueConnection);
    const { worker, deadLetterQueue } = job.createWorker(workerConnection);

    try {
      await job.enqueue(queue, { willFail: true });
      await waitFor(async () => (await deadLetterQueue.entries()).length > 0, 20_000);

      const entries = await deadLetterQueue.entries();
      expect(entries.length).toBe(1);
      expect(entries[0]?.data.name).toBe('always-fails');
      expect(entries[0]?.data.attemptsMade).toBe(2);
      expect(entries[0]?.data.failedReason).toContain('simulated permanent failure');
    } finally {
      await worker.close();
      await deadLetterQueue.close();
      await queue.close();
      queueConnection.disconnect();
      workerConnection.disconnect();
    }
  }, 30_000);
});
