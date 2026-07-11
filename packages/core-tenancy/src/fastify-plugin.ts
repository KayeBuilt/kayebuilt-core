import type { FastifyPluginCallback, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { runWithTenantContext } from './context.js';

export interface TenancyPluginOptions {
  /**
   * Extracts the active tenant id from a request (typically the
   * authenticated session's organization id from core-auth). Return
   * `undefined` for routes that are intentionally tenant-less (health
   * checks, auth callbacks, webhooks) — the request proceeds without a
   * tenant context, and any handler code that calls `requireTenantId()`
   * will throw rather than silently running unscoped.
   */
  getTenantId: (request: FastifyRequest) => string | undefined | Promise<string | undefined>;
}

/**
 * Registers an `onRequest` hook that establishes the AsyncLocalStorage
 * tenant context for the rest of that request's lifecycle. Uses the
 * callback-style hook signature (rather than `async (request, reply) => {}`)
 * so `runWithTenantContext`'s synchronous `storage.run` call is the one
 * that actually invokes the rest of Fastify's dispatch chain via `done()` —
 * that's what makes every downstream hook and handler (including ones that
 * `await` past a microtask) see the tenant context. An async hook body
 * would return control to Fastify's own promise chain before running the
 * handler, outside the AsyncLocalStorage scope.
 */
export const tenancyPlugin: FastifyPluginCallback<TenancyPluginOptions> = fp<TenancyPluginOptions>(
  (fastify, options, done) => {
    fastify.addHook('onRequest', (request, _reply, hookDone) => {
      Promise.resolve(options.getTenantId(request)).then((tenantId) => {
        if (tenantId === undefined) {
          hookDone();
          return;
        }
        runWithTenantContext(tenantId, () => hookDone());
      }, hookDone);
    });
    done();
  },
);
