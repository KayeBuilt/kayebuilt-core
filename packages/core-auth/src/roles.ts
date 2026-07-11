/**
 * The five roles a member can hold within an organization (tenant). Fixed
 * by PROJECT-CONTEXT.md — not extensible per-app without an ADR.
 */
export const ROLES = ['readonly', 'field', 'accounting', 'pm', 'owner'] as const;

export type Role = (typeof ROLES)[number];

/**
 * Linear seniority ordering, lowest to highest privilege. `requireRole(min)`
 * admits any role at or above `min` in this list.
 *
 * This is a judgment call, not a spec requirement: the five roles are named
 * in the plan but their relative ordering isn't. `accounting` is placed
 * above `field` and below `pm` because in this domain accounting needs
 * visibility into money that field crews don't, but shouldn't override PM
 * scheduling/commitment decisions. If a route needs "accounting can do X but
 * PM can't" (non-hierarchical), don't use requireRole for it — check
 * `role === 'accounting'` directly instead.
 */
const SENIORITY: Record<Role, number> = Object.fromEntries(
  ROLES.map((role, index) => [role, index]),
) as Record<Role, number>;

export function isValidRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** True if `actual` meets or exceeds `required` in seniority. */
export function hasRequiredRole(actual: Role, required: Role): boolean {
  return SENIORITY[actual] >= SENIORITY[required];
}
