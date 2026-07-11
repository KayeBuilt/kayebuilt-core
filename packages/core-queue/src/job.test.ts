import { describe, expect, it } from 'vitest';
import { defineJob } from './job.js';

describe('defineJob', () => {
  it('captures name, handler, and options without connecting to anything', () => {
    const handler = async () => {};
    const def = defineJob<{ foo: string }>('send-welcome-email', handler, {
      retry: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      repeat: { every: 60_000 },
    });

    expect(def.name).toBe('send-welcome-email');
    expect(def.handler).toBe(handler);
    expect(def.options.retry?.attempts).toBe(3);
    expect(def.options.repeat?.every).toBe(60_000);
    expect(typeof def.createQueue).toBe('function');
    expect(typeof def.createWorker).toBe('function');
    expect(typeof def.enqueue).toBe('function');
  });

  it('defaults options to an empty object', () => {
    const def = defineJob('noop', async () => {});
    expect(def.options).toEqual({});
  });
});
