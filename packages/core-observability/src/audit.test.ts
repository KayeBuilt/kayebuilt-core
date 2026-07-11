import { describe, expect, it, vi } from 'vitest';
import type { AuditLogEntry, AuditSink } from './audit.js';
import { LogAuditSink, writeAuditLog } from './audit.js';
import type { Logger } from './logger.js';

describe('LogAuditSink', () => {
  it('logs all required fields via the provided logger', async () => {
    const info = vi.fn();
    const logger = { info } as unknown as Logger;
    const sink = new LogAuditSink(logger);

    const entry: AuditLogEntry = {
      tenantId: 't1',
      actorId: 'u1',
      action: 'project.create',
      targetType: 'project',
      targetId: 'p1',
      metadata: { name: 'Kyle Spec 1' },
    };
    await sink.write(entry);

    expect(info).toHaveBeenCalledTimes(1);
    const [payload, msg] = info.mock.calls[0] as [Record<string, unknown>, string];
    expect(msg).toBe('audit_log');
    expect(payload).toMatchObject({ audit: true, ...entry });
    expect(typeof payload.timestamp).toBe('string');
  });
});

describe('writeAuditLog', () => {
  it('delegates to a custom AuditSink implementation', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const sink: AuditSink = { write };
    const entry: AuditLogEntry = {
      tenantId: 't1',
      actorId: 'u1',
      action: 'x',
      targetType: 'y',
      targetId: 'z',
    };
    await writeAuditLog(sink, entry);
    expect(write).toHaveBeenCalledWith(entry);
  });
});
