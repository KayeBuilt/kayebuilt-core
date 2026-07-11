import { describe, expect, it } from 'vitest';
import { FeatureFlags } from './flags.js';

describe('FeatureFlags', () => {
  const defaults = { renovateAutomerge: false, betaDashboard: true };

  it('uses defaults when no env override is present', () => {
    const flags = new FeatureFlags(defaults, {});
    expect(flags.isEnabled('renovateAutomerge')).toBe(false);
    expect(flags.isEnabled('betaDashboard')).toBe(true);
  });

  it('overrides a flag from FEATURE_<KEY>=true', () => {
    const flags = new FeatureFlags(defaults, { FEATURE_RENOVATEAUTOMERGE: 'true' });
    expect(flags.isEnabled('renovateAutomerge')).toBe(true);
  });

  it('overrides a flag to false from FEATURE_<KEY>=false', () => {
    const flags = new FeatureFlags(defaults, { FEATURE_BETADASHBOARD: 'false' });
    expect(flags.isEnabled('betaDashboard')).toBe(false);
  });

  it('all() returns the resolved flag set', () => {
    const flags = new FeatureFlags(defaults, { FEATURE_RENOVATEAUTOMERGE: '1' });
    expect(flags.all()).toEqual({ renovateAutomerge: true, betaDashboard: true });
  });
});
