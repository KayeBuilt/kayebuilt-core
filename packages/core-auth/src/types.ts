import type { AuthInstance } from './auth.js';

/**
 * Inferred from the configured better-auth instance via its `$Infer`
 * pattern, so plugin-contributed fields (e.g. organization plugin's
 * activeOrganizationId) are included automatically instead of hand-rolled
 * and drifting from the real shape.
 */
export type AuthSession = AuthInstance['$Infer']['Session'];
export type AuthUser = AuthSession['user'];
