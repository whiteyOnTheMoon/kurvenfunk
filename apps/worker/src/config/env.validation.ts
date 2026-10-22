import { z } from 'zod';

const workerEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    REDIS_HOST: z.string().trim().min(1).default('redis'),

    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

    REDIS_PASSWORD: z.string().min(1),

    DATABASE_URL: z.string().trim().min(1),

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

  return result.data;
}
