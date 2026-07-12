import { describe, expect, it } from 'vitest';
import { rlsPolicy, tenantColumns } from './rls.js';

describe('rlsPolicy', () => {
  it('generates enable + force + policy DDL scoped to the given table', () => {
    const ddl = rlsPolicy('budget_lines');
    expect(ddl).toContain('ALTER TABLE "budget_lines" ENABLE ROW LEVEL SECURITY;');
    expect(ddl).toContain('ALTER TABLE "budget_lines" FORCE ROW LEVEL SECURITY;');
    expect(ddl).toContain('CREATE POLICY "tenant_isolation" ON "budget_lines"');
    expect(ddl).toContain('"tenant_id" = current_setting(\'app.tenant_id\', true)');
  });

  it('honors custom column and policy names', () => {
    const ddl = rlsPolicy('legacy_table', { tenantColumn: 'org_id', policyName: 'org_isolation' });
    expect(ddl).toContain('CREATE POLICY "org_isolation" ON "legacy_table"');
    expect(ddl).toContain('"org_id" = current_setting');
  });

  it('escapes embedded double quotes in identifiers', () => {
    const ddl = rlsPolicy('weird"table');
    expect(ddl).toContain('"weird""table"');
  });
});

describe('tenantColumns', () => {
  it('exposes a not-null tenantId column', () => {
    const columns = tenantColumns();
    expect(columns.tenantId).toBeDefined();
  });
});
