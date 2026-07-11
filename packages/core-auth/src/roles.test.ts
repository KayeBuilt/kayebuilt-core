import { describe, expect, it } from 'vitest';
import { ROLES, hasRequiredRole, isValidRole } from './roles.js';

describe('ROLES', () => {
  it('is exactly the five roles named in PROJECT-CONTEXT, in seniority order', () => {
    expect(ROLES).toEqual(['readonly', 'field', 'accounting', 'pm', 'owner']);
  });
});

describe('isValidRole', () => {
  it('accepts each of the five roles', () => {
    for (const role of ROLES) {
      expect(isValidRole(role)).toBe(true);
    }
  });

  it('rejects unknown strings', () => {
    expect(isValidRole('admin')).toBe(false);
    expect(isValidRole('')).toBe(false);
    expect(isValidRole('Owner')).toBe(false);
  });
});

describe('hasRequiredRole', () => {
  it('admits a role that exactly matches the requirement', () => {
    expect(hasRequiredRole('pm', 'pm')).toBe(true);
  });

  it('admits a more senior role than required', () => {
    expect(hasRequiredRole('owner', 'pm')).toBe(true);
    expect(hasRequiredRole('owner', 'readonly')).toBe(true);
    expect(hasRequiredRole('pm', 'field')).toBe(true);
  });

  it('rejects a less senior role than required', () => {
    expect(hasRequiredRole('field', 'pm')).toBe(false);
    expect(hasRequiredRole('readonly', 'accounting')).toBe(false);
    expect(hasRequiredRole('pm', 'owner')).toBe(false);
  });

  it('places accounting between field and pm', () => {
    expect(hasRequiredRole('accounting', 'field')).toBe(true);
    expect(hasRequiredRole('field', 'accounting')).toBe(false);
    expect(hasRequiredRole('pm', 'accounting')).toBe(true);
    expect(hasRequiredRole('accounting', 'pm')).toBe(false);
  });

  it('owner is admitted by every requirement', () => {
    for (const required of ROLES) {
      expect(hasRequiredRole('owner', required)).toBe(true);
    }
  });

  it('readonly is only admitted when readonly is required', () => {
    for (const required of ROLES) {
      expect(hasRequiredRole('readonly', required)).toBe(required === 'readonly');
    }
  });
});
