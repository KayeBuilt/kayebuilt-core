import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { requireTenantId } from './context.js';
import { tenancyPlugin } from './fastify-plugin.js';

describe('tenancyPlugin', () => {
  it('makes the tenant id available to the handler via requireTenantId()', async () => {
    const app = Fastify();
    await app.register(tenancyPlugin, {
      getTenantId: (request) => request.headers['x-tenant-id'] as string | undefined,
    });
    app.get('/whoami', async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return { tenantId: requireTenantId() };
    });

    const response = await app.inject({
      method: 'GET',
      url: '/whoami',
      headers: { 'x-tenant-id': 'tenant-xyz' },
    });

    expect(response.json()).toEqual({ tenantId: 'tenant-xyz' });
  });

  it('lets tenant-less routes through, leaving requireTenantId() to throw if called', async () => {
    const app = Fastify();
    await app.register(tenancyPlugin, { getTenantId: () => undefined });
    app.get('/health', async () => ({ ok: true }));

    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.json()).toEqual({ ok: true });
  });

  it('does not leak tenant context between concurrent requests', async () => {
    const app = Fastify();
    await app.register(tenancyPlugin, {
      getTenantId: (request) => request.headers['x-tenant-id'] as string | undefined,
    });
    app.get('/whoami', async () => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
      return { tenantId: requireTenantId() };
    });

    const [a, b] = await Promise.all([
      app.inject({ method: 'GET', url: '/whoami', headers: { 'x-tenant-id': 'tenant-a' } }),
      app.inject({ method: 'GET', url: '/whoami', headers: { 'x-tenant-id': 'tenant-b' } }),
    ]);

    expect(a.json()).toEqual({ tenantId: 'tenant-a' });
    expect(b.json()).toEqual({ tenantId: 'tenant-b' });
  });
});
