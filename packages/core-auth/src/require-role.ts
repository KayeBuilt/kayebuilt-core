import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthInstance } from './auth.js';
import { type Role, hasRequiredRole, isValidRole } from './roles.js';

declare module 'fastify' {
  interface FastifyInstance {
    auth: AuthInstance;
  }
}

function toWebHeaders(headers: FastifyRequest['headers']): Headers {
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      webHeaders.append(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) webHeaders.append(key, v);
    }
  }
  return webHeaders;
}

/**
 * Fastify preHandler factory. Apps must decorate the fastify instance with
 * `auth` (the result of createAuth()) before registering routes that use
 * this guard — e.g. `fastify.decorate('auth', createAuth({ ... }))`.
 *
 * NOTE: the call used to resolve the caller's role in the active
 * organization is `auth.api.getActiveMember`, which is the best-effort
 * mapping to better-auth's organization-plugin API as of the version
 * pinned in package.json. This is the least-verified part of this package
 * — if better-auth's actual method name/shape differs, this is where it'll
 * surface (a 403 instead of an allow, since failures are fail-closed).
 */
export function requireRole(required: Role) {
  return async function requireRolePreHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const auth = request.server.auth;
    if (!auth) {
      throw new Error(
        'requireRole() used but fastify instance has no `auth` decoration — call fastify.decorate("auth", createAuth(...)) first.',
      );
    }

    const headers = toWebHeaders(request.headers);

    const session = await auth.api.getSession({ headers });
    if (!session) {
      reply.code(401).send({ error: 'unauthorized' });
      return;
    }

    let role: string | undefined;
    try {
      // biome-ignore lint/suspicious/noExplicitAny: getActiveMember's return shape isn't re-exported as a named type by better-auth.
      const member = await (auth.api as any).getActiveMember({ headers });
      role = member?.role;
    } catch {
      role = undefined;
    }

    if (!role || !isValidRole(role) || !hasRequiredRole(role, required)) {
      reply.code(403).send({ error: 'forbidden' });
      return;
    }
  };
}
