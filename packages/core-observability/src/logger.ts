import pino, { type Logger as PinoLogger, type LoggerOptions, type DestinationStream } from 'pino';

export interface LoggerEnv {
  NODE_ENV: string;
  LOG_LEVEL?: string;
}

export interface CreateLoggerOptions {
  bindings?: Record<string, unknown>;
  /** Override the write destination — mainly for tests that want to capture output. */
  destination?: NodeJS.WritableStream;
}

export type Logger = PinoLogger;

/**
 * pino-pretty is only wired up when NODE_ENV=development and no explicit
 * destination is given, so it never has to be resolvable in production
 * (it's a devDependency, not a runtime one).
 */
export function createLogger(env: LoggerEnv, options: CreateLoggerOptions = {}): Logger {
  const isDev = env.NODE_ENV === 'development';
  const opts: LoggerOptions = {
    level: env.LOG_LEVEL ?? 'info',
    base: options.bindings ?? {},
  };
  if (isDev && !options.destination) {
    opts.transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard' },
    };
  }
  return options.destination ? pino(opts, options.destination as DestinationStream) : pino(opts);
}
