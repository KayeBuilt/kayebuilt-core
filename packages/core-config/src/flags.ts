/**
 * Minimal typed feature flags. Values come from env vars prefixed FEATURE_
 * (e.g. FEATURE_RENOVATE_AUTOMERGE=true) or an explicit overrides map, so
 * flags are flippable without a code change or external service.
 */
export type FeatureFlagDefaults = Record<string, boolean>;

export class FeatureFlags<TFlags extends FeatureFlagDefaults> {
  private readonly values: TFlags;

  constructor(defaults: TFlags, source: Record<string, string | undefined> = process.env) {
    const values = { ...defaults };
    for (const key of Object.keys(defaults) as Array<keyof TFlags>) {
      const envKey = `FEATURE_${String(key).toUpperCase()}`;
      const raw = source[envKey];
      if (raw !== undefined) {
        values[key] = (raw === 'true' || raw === '1') as TFlags[typeof key];
      }
    }
    this.values = values;
  }

  isEnabled(flag: keyof TFlags): boolean {
    return this.values[flag] as boolean;
  }

  all(): Readonly<TFlags> {
    return this.values;
  }
}
