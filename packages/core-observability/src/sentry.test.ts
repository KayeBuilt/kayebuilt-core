import { beforeEach, describe, expect, it, vi } from 'vitest';

const initMock = vi.fn();
const captureExceptionMock = vi.fn();

vi.mock('@sentry/node', () => ({
  init: initMock,
  captureException: captureExceptionMock,
}));

const { initSentry, captureException, isSentryInitialized } = await import('./sentry.js');

describe('Sentry integration', () => {
  beforeEach(() => {
    initMock.mockClear();
    captureExceptionMock.mockClear();
  });

  it('is a true no-op when no DSN is configured', () => {
    initSentry({});
    expect(initMock).not.toHaveBeenCalled();
    expect(isSentryInitialized()).toBe(false);

    captureException(new Error('boom'));
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('initializes and forwards exceptions when a DSN is configured', () => {
    initSentry({
      SENTRY_DSN: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      NODE_ENV: 'production',
    });
    expect(initMock).toHaveBeenCalledWith(expect.objectContaining({ dsn: expect.any(String) }));
    expect(isSentryInitialized()).toBe(true);

    const err = new Error('boom');
    captureException(err, { userId: '123' });
    expect(captureExceptionMock).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ extra: { userId: '123' } }),
    );
  });

  it('goes back to a no-op after re-init without a DSN', () => {
    initSentry({ SENTRY_DSN: 'https://examplePublicKey@o0.ingest.sentry.io/0' });
    expect(isSentryInitialized()).toBe(true);

    initSentry({});
    expect(isSentryInitialized()).toBe(false);
    captureException(new Error('boom'));
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });
});
