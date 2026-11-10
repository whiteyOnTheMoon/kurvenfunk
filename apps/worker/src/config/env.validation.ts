import { z } from 'zod';

const workerEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    REDIS_HOST: z.string().trim().min(1).default('redis'),

    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

    REDIS_PASSWORD: z.string().min(1),

    DATABASE_URL: z.string().trim().min(1),

    // Defaults OFF; fake sport data may never run in production.
    SPORTS_FAKE_PROVIDER_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    // Phase 21.204: separate and bounded fake sports schedules; OFF by default.
    SPORTS_IMPORT_SCHEDULER_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SPORTS_IMPORT_LIVE_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SPORTS_IMPORT_FIXTURES_INTERVAL_MS: z.coerce
      .number()
      .int()
      .min(60_000)
      .max(604_800_000)
      .default(43_200_000),
    SPORTS_IMPORT_RESULTS_INTERVAL_MS: z.coerce
      .number()
      .int()
      .min(60_000)
      .max(604_800_000)
      .default(900_000),
    SPORTS_IMPORT_LIVE_INTERVAL_MS: z.coerce
      .number()
      .int()
      .min(60_000)
      .max(604_800_000)
      .default(60_000),

    NEWS_IMPORT_PROVIDER: z.enum(['fake', 'ots']).default('fake'),

    NEWS_IMPORT_SCHEDULER_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    NEWS_IMPORT_SCHEDULER_INTERVAL_MS: z.coerce.number().int().min(1_000).default(300_000),

    NEWS_OTS_API_KEY: z.string().trim().min(1).optional(),
    NEWS_OTS_API_BASE_URL: z.string().trim().url().default('https://www.ots.at/api'),
    NEWS_OTS_QUERY: z.string().trim().min(1).default('Fußball'),
    NEWS_OTS_PAGE_SIZE: z.coerce.number().int().min(1).max(100).default(20),
    NEWS_OTS_MAX_PAGES: z.coerce.number().int().min(1).max(100).default(5),
    NEWS_OTS_LOOKBACK_MINUTES: z.coerce.number().int().min(1).max(1_440).default(15),

    WORKER_RUN_STARTUP_TEST: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .passthrough();

export type WorkerEnvironment = z.infer<typeof workerEnvSchema>;

export function validateEnvironment(config: Record<string, unknown>): WorkerEnvironment {
  const result = workerEnvSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const field = issue.path.join('.') || 'environment';
        return `- ${field}: ${issue.message}`;
      })
      .join('\n');

    throw new Error(`Worker environment validation failed:\n${errors}`);
  }

  if (result.data.SPORTS_FAKE_PROVIDER_ENABLED && result.data.NODE_ENV === 'production') {
    throw new Error('FAKE_SPORTS_FORBIDDEN_ENVIRONMENT');
  }
  if (
    result.data.SPORTS_IMPORT_SCHEDULER_ENABLED &&
    (!result.data.SPORTS_FAKE_PROVIDER_ENABLED ||
      (result.data.NODE_ENV !== 'development' && result.data.NODE_ENV !== 'test'))
  ) {
    throw new Error('SPORTS_SCHEDULER_REQUIRES_DEV_FAKE_PROVIDER');
  }

  return result.data;
}
