import { type Job, Queue, type Worker } from 'bullmq';
import type { Redis } from 'ioredis';

export interface DeadLetterEntry<TPayload> {
  originalJobId: string;
  name: string;
  payload: TPayload;
  failedReason: string;
  attemptsMade: number;
  failedAt: number;
}

/**
 * Bullmq's Queue<DataTypeOrJob, ResultType, NameType, DataType, ...> derives
 * its trailing generics from DataTypeOrJob via conditional types that don't
 * reduce cleanly when DataTypeOrJob is itself an unresolved generic (like
 * our TPayload) — pin every slot explicitly so this type is structurally
 * identical everywhere it's used, instead of letting each call site infer
 * its own (subtly different) default instantiation.
 */
// biome-ignore lint/suspicious/noExplicitAny: matches bullmq's own generic default for ResultType
type BullResultAny = any;

type DeadLetterBullQueue<TPayload> = Queue<
  DeadLetterEntry<TPayload>,
  BullResultAny,
  string,
  DeadLetterEntry<TPayload>,
  BullResultAny,
  string
>;

/**
 * BullMQ has no built-in DLQ: a job that exhausts its retries just sits
 * failed in its own queue. This wraps a second, dedicated `${name}-dead`
 * queue that exhausted jobs get copied into, so failures stay inspectable
 * (and replayable) instead of silently disappearing. (BullMQ queue names
 * can't contain `:` — it's a Redis key-delimiter reserved character — hence
 * `-dead` rather than `:dead`.)
 */
export class DeadLetterQueue<TPayload> {
  private readonly queue: DeadLetterBullQueue<TPayload>;

  constructor(sourceName: string, connection: Redis) {
    this.queue = new Queue(`${sourceName}-dead`, { connection }) as DeadLetterBullQueue<TPayload>;
  }

  async record(job: Job<TPayload>): Promise<void> {
    await this.queue.add('dead-letter', {
      originalJobId: job.id ?? 'unknown',
      name: job.name,
      payload: job.data,
      failedReason: job.failedReason ?? 'unknown',
      attemptsMade: job.attemptsMade,
      failedAt: Date.now(),
    });
  }

  async entries(): Promise<Job<DeadLetterEntry<TPayload>>[]> {
    return this.queue.getJobs(['completed', 'waiting', 'active', 'delayed', 'paused']);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

/** Wires a worker's `failed` event so exhausted jobs land in the dead-letter queue instead of vanishing. */
export function attachDeadLetterQueue<TPayload>(
  worker: Worker<TPayload>,
  deadLetterQueue: DeadLetterQueue<TPayload>,
  maxAttempts: number,
): void {
  worker.on('failed', (job) => {
    if (!job) return;
    if (job.attemptsMade >= maxAttempts) {
      void deadLetterQueue.record(job);
    }
  });
}
