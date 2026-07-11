import { describe, expect, it } from 'vitest';
import { createDb } from './client.js';

describe('createDb', () => {
  it('returns a db, client, and close() without eagerly connecting', () => {
    const { db, client, close } = createDb({
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
    });
    expect(db).toBeDefined();
    expect(client).toBeDefined();
    expect(typeof close).toBe('function');
  });

  it('respects a custom pool size', () => {
    const { client } = createDb(
      { DATABASE_URL: 'postgres://user:pass@localhost:5432/db' },
      undefined,
      { max: 3 },
    );
    expect(client.options.max).toBe(3);
  });
});
