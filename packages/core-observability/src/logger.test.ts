import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from './logger.js';

function createCaptureStream() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(chunk.toString());
      cb();
    },
  });
  return { stream, lines };
}

describe('createLogger', () => {
  it('emits JSON lines and filters below LOG_LEVEL', () => {
    const { stream, lines } = createCaptureStream();
    const logger = createLogger(
      { NODE_ENV: 'production', LOG_LEVEL: 'warn' },
      { destination: stream },
    );
    logger.info('should be filtered out');
    logger.warn('should appear');

    expect(lines.length).toBe(1);
    const parsed = JSON.parse(lines[0] as string);
    expect(parsed.msg).toBe('should appear');
  });

  it('binds base context and child() context', () => {
    const { stream, lines } = createCaptureStream();
    const logger = createLogger(
      { NODE_ENV: 'production', LOG_LEVEL: 'info' },
      { destination: stream, bindings: { service: 'api' } },
    );
    const child = logger.child({ tenantId: 't1' });
    child.info('hi');

    const parsed = JSON.parse(lines[0] as string);
    expect(parsed.service).toBe('api');
    expect(parsed.tenantId).toBe('t1');
  });
});
