import { describe, expect, it } from 'vitest';
import { getTenantContext, requireTenantId, runWithTenantContext } from './context.js';

describe('tenant context', () => {
  it('is unset outside runWithTenantContext', () => {
    expect(getTenantContext()).toBeUndefined();
    expect(() => requireTenantId()).toThrow(/No tenant context is active/);
  });

  it('is visible inside runWithTenantContext, including across an await', async () => {
    await runWithTenantContext('tenant-a', async () => {
      expect(requireTenantId()).toBe('tenant-a');
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(requireTenantId()).toBe('tenant-a');
    });
  });

  it('does not leak between sibling calls', () => {
    runWithTenantContext('tenant-a', () => {
      expect(requireTenantId()).toBe('tenant-a');
    });
    runWithTenantContext('tenant-b', () => {
      expect(requireTenantId()).toBe('tenant-b');
    });
    expect(getTenantContext()).toBeUndefined();
  });
});
