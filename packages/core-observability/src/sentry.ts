import * as Sentry from '@sentry/node';

export interface SentryEnv {
  SENTRY_DSN?: string;
  NODE_ENV?: string;
}

let initialized = false;

/** True no-op when SENTRY_DSN is unset — never touches the network, never requires an account. */
export function initSentry(env: SentryEnv): void {
  if (!env.SENTRY_DSN) {
    initialized = false;
    return;
  }
  Sentry.init({ dsn: env.SENTRY_DSN, ...(env.NODE_ENV ? { environment: env.NODE_ENV } : {}) });
  initialized = true;
}

/** Safe to call unconditionally from any call site — silently drops the error when Sentry isn't configured. */
export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

export function isSentryInitialized(): boolean {
  return initialized;
}
