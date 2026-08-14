import { z } from 'zod';

const apiEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    REDIS_HOST: z.string().min(1).default('redis'),

    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

    REDIS_PASSWORD: z.string().min(1),

    DATABASE_URL: z.string().url(),
    WEB_URL: z.string().url(),
    KEYCLOAK_ISSUER: z.string().url(),
    KEYCLOAK_JWKS_URL: z.string().url(),
    KEYCLOAK_AUDIENCE: z.string().min(1),
    SWAGGER_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .passthrough();

export type ApiEnvironment = z.infer<typeof apiEnvSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): ApiEnvironment {
  const result = apiEnvSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const field = issue.path.join('.') || 'environment';
        return `- ${field}: ${issue.message}`;
      })
      .join('\n');

    throw new Error(`API environment validation failed:\n${errors}`);
  }

  return result.data;
}
