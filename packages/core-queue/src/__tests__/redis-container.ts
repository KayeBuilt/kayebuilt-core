import { Redis } from 'ioredis';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';

export interface TestRedisHandle {
  connection: Redis;
  url: string;
  container: StartedTestContainer;
  cleanup: () => Promise<void>;
}

/** Spins up a throwaway Redis via testcontainers for BullMQ integration tests. */
export async function withTestRedis(): Promise<TestRedisHandle> {
  const container = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();
  const host = container.getHost();
  const port = container.getMappedPort(6379);
  const url = `redis://${host}:${port}`;
  const connection = new Redis(url, { maxRetriesPerRequest: null });

  return {
    connection,
    url,
    container,
    cleanup: async () => {
      connection.disconnect();
      await container.stop();
    },
  };
}
