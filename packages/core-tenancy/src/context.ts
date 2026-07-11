import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContext {
  tenantId: string;
}

const storage = new AsyncLocalStorage<TenantContext>();

/**
 * Establishes the active tenant for every async continuation started inside
 * `fn` (including ones that resume after an `await`), via AsyncLocalStorage.
 * This is the in-process counterpart to `runAsTenant`'s DB-level
 * `SET LOCAL app.tenant_id` — request handlers read the tenant via
 * `requireTenantId()` without threading it through every function signature.
 */
export function runWithTenantContext<T>(tenantId: string, fn: () => T): T {
  return storage.run({ tenantId }, fn);
}

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore();
}

/** Throws if called outside `runWithTenantContext` (or the fastify plugin's request scope) — fails closed rather than silently running tenant-less. */
export function requireTenantId(): string {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error(
      'No tenant context is active. Wrap this call in runWithTenantContext(tenantId, fn), or register the tenancy fastify plugin.',
    );
  }
  return ctx.tenantId;
}
