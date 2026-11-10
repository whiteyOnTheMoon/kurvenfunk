import { validateEnvironment } from './env.validation';

const base = {
  REDIS_PASSWORD: 'isolated-test-password',
  DATABASE_URL: 'postgresql://fake:fake@localhost:5432/test',
};

describe('Phase 21.204 worker environment validation', () => {
  it('disables every sports scheduler by default and provides independent cadences', () => {
    const result = validateEnvironment(base);
    expect(result.SPORTS_FAKE_PROVIDER_ENABLED).toBe(false);
    expect(result.SPORTS_IMPORT_SCHEDULER_ENABLED).toBe(false);
    expect(result.SPORTS_IMPORT_LIVE_ENABLED).toBe(false);
    expect(result.SPORTS_IMPORT_FIXTURES_INTERVAL_MS).toBe(43_200_000);
    expect(result.SPORTS_IMPORT_RESULTS_INTERVAL_MS).toBe(900_000);
    expect(result.SPORTS_IMPORT_LIVE_INTERVAL_MS).toBe(60_000);
  });

  it('supports deliberate DEV-only synthetic schedules and separate intervals', () => {
    const result = validateEnvironment({
      ...base,
      NODE_ENV: 'development',
      SPORTS_FAKE_PROVIDER_ENABLED: 'true',
      SPORTS_IMPORT_SCHEDULER_ENABLED: 'true',
      SPORTS_IMPORT_LIVE_ENABLED: 'true',
      SPORTS_IMPORT_FIXTURES_INTERVAL_MS: '3600000',
      SPORTS_IMPORT_RESULTS_INTERVAL_MS: '600000',
      SPORTS_IMPORT_LIVE_INTERVAL_MS: '60000',
    });
    expect(result.SPORTS_IMPORT_SCHEDULER_ENABLED).toBe(true);
    expect(result.SPORTS_IMPORT_LIVE_ENABLED).toBe(true);
    expect(result.SPORTS_IMPORT_FIXTURES_INTERVAL_MS).toBe(3_600_000);
    expect(result.SPORTS_IMPORT_RESULTS_INTERVAL_MS).toBe(600_000);
    expect(result.SPORTS_IMPORT_LIVE_INTERVAL_MS).toBe(60_000);
  });

  it('rejects production, missing opt-in and unsafe intervals', () => {
    expect(() =>
      validateEnvironment({
        ...base,
        NODE_ENV: 'production',
        SPORTS_IMPORT_SCHEDULER_ENABLED: 'true',
      }),
    ).toThrow('SPORTS_SCHEDULER_REQUIRES_DEV_FAKE_PROVIDER');

    expect(() => validateEnvironment({ ...base, SPORTS_IMPORT_SCHEDULER_ENABLED: 'true' })).toThrow(
      'SPORTS_SCHEDULER_REQUIRES_DEV_FAKE_PROVIDER',
    );

    expect(() =>
      validateEnvironment({
        ...base,
        NODE_ENV: 'production',
        SPORTS_FAKE_PROVIDER_ENABLED: 'true',
        SPORTS_IMPORT_SCHEDULER_ENABLED: 'true',
      }),
    ).toThrow('FAKE_SPORTS_FORBIDDEN_ENVIRONMENT');

    for (const config of [
      { SPORTS_IMPORT_FIXTURES_INTERVAL_MS: '999' },
      { SPORTS_IMPORT_RESULTS_INTERVAL_MS: '604800001' },
      { SPORTS_IMPORT_LIVE_INTERVAL_MS: '0' },
      { SPORTS_IMPORT_LIVE_INTERVAL_MS: 'not-a-number' },
    ]) {
      expect(() => validateEnvironment({ ...base, ...config })).toThrow(
        'Worker environment validation failed',
      );
    }
  });

  it('does not mistake explicit false flags for enabled schedules', () => {
    expect(
      validateEnvironment({
        ...base,
        NODE_ENV: 'production',
        SPORTS_IMPORT_SCHEDULER_ENABLED: 'false',
        SPORTS_IMPORT_LIVE_ENABLED: 'false',
      }).SPORTS_IMPORT_SCHEDULER_ENABLED,
    ).toBe(false);
  });
});
