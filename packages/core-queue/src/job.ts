import {
  type Job,
  type JobsOptions,
  Queue,
  type QueueOptions,
  Worker,
  type WorkerOptions,
} from 'bullmq';
import type { Redis } from 'ioredis';
import { DeadLetterQueue, attachDeadLetterQueue } from './dead-letter.js';

export interface RetryOptions {
  attempts?: number;
  backoff?: { type: 'fixed' | 'exponential'; delay: number };
}

export interface RepeatOptions {
  /** Cron pattern, e.g. "0 0 * * *". Mutually exclusive with `every`. */
  pattern?: string;
  /** Fixed interval in ms. Mutually exclusive with `pattern`. */
  every?: number;
}

export interface DefineJobOptions {
  retry?: RetryOptions;
  repeat?: RepeatOptions;
}

export type JobHandler<TPayload> = (payload: TPayload, job: Job<TPayload>) => Promise<void>;

export interface CreatedWorker<TPayload> {
  worker: Worker<TPayload>;
  deadLetterQueue: DeadLetterQueue<TPayload>;
}

/**
 * Bullmq's Queue<DataTypeOrJob, ResultType, NameType, DataType, ...> derives
 * its trailing generics from DataTypeOrJob via conditional types that don't
 * reduce cleanly when DataTypeOrJob is itself an unresolved generic (like
 * our TPayload) — pin every slot explicitly so this type is structurally
 * identical everywhere it's used, instead of letting each call site infer
 * its own (subtly different) default instantiation.
 */
// biome-ignore lint/suspicious/noExplicitAny: matches bullmq's own generic defaults (ResultType = any)
type PayloadQueue<TPayload> = Queue<TPayload, any, string, TPayload, any, string>;

export interface JobDefinition<TPayload> {
  name: string;
  handler: JobHandler<TPayload>;
  options: DefineJobOptions;
  /** Creates a BullMQ Queue bound to this job's name, for enqueuing. */
  createQueue(
    connection: Redis,
    queueOptions?: Omit<QueueOptions, 'connection'>,
  ): PayloadQueue<TPayload>;
  /** Enqueues one instance of this job, applying the retry/repeat config from `defineJob`. */
  enqueue(
    queue: PayloadQueue<TPayload>,
    payload: TPayload,
    jobOptions?: JobsOptions,
  ): Promise<Job<TPayload>>;
  /** Creates a BullMQ Worker bound to this job's name + handler, with a dead-letter queue wired to its `failed` event. */
  createWorker(
    connection: Redis,
    workerOptions?: Omit<WorkerOptions, 'connection'>,
  ): CreatedWorker<TPayload>;
}

function resolveJobsOptions(options: DefineJobOptions, overrides: JobsOptions): JobsOptions {
  const resolved: JobsOptions = { ...overrides };
  if (resolved.attempts === undefined && options.retry?.attempts !== undefined) {
    resolved.attempts = options.retry.attempts;
  }
  if (resolved.backoff === undefined && options.retry?.backoff !== undefined) {
    resolved.backoff = options.retry.backoff;
  }
  if (resolved.repeat === undefined) {
    if (options.repeat?.pattern !== undefined) {
      resolved.repeat = { pattern: options.repeat.pattern };
    } else if (options.repeat?.every !== undefined) {
      resolved.repeat = { every: options.repeat.every };
    }
  }
  return resolved;
}

/**
 * Ties a job's name, payload type, and handler together in one definition so
 * producer (`enqueue`) and consumer (`createWorker`) sides can never drift —
 * there's exactly one place that knows the job's name string and shape.
 */
export function defineJob<TPayload>(
  name: string,
  handler: JobHandler<TPayload>,
  options: DefineJobOptions = {},
): JobDefinition<TPayload> {
  return {
    name,
    handler,
    options,
    createQueue(connection, queueOptions = {}) {
      // biome-ignore lint/suspicious/noExplicitAny: matches bullmq's own generic defaults (ResultType = any)
      return new Queue<TPayload, any, string, TPayload, any, string>(name, {
        connection,
        ...queueOptions,
      });
    },
    enqueue(queue, payload, jobOptions = {}) {
      return queue.add(name, payload, resolveJobsOptions(options, jobOptions));
    },
    createWorker(connection, workerOptions = {}) {
      const worker = new Worker<TPayload>(name, (job) => handler(job.data, job), {
        connection,
        ...workerOptions,
      });
      const deadLetterQueue = new DeadLetterQueue<TPayload>(name, connection);
      attachDeadLetterQueue(worker, deadLetterQueue, options.retry?.attempts ?? 1);
      return { worker, deadLetterQueue };
    },
  };
}
