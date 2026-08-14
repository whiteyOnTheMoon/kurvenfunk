import { z } from 'zod';

const workerEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    REDIS_HOST: z.string().trim().min(1).default('redis'),

    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

    REDIS_PASSWORD: z.string().min(1),

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
