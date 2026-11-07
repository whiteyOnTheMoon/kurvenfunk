import { z } from 'zod';

const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    REDIS_HOST: z.string().min(1).default('redis'),

    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

    REDIS_PASSWORD: z.string().min(1),

    // Task 181: optional until trusted-proxy IP protection is enabled in Tasks 182–185.
    // Empty strings from Docker Compose are treated as disabled, not as HMAC keys.
    IP_HASH_HMAC_SECRET: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().min(43).max(128).regex(/^[A-Za-z0-9_-]+$/).optional(),
    ),
    IP_HASH_KEY_VERSION: z.string().regex(/^v[1-9][0-9]{0,2}$/).default('v1'),
    IP_HASH_PREVIOUS_KEYS_JSON: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().optional(),
    ),

    DATABASE_URL: z.string().url(),
    WEB_URL: z.string().url(),
    KEYCLOAK_ISSUER: z.string().url(),
    KEYCLOAK_JWKS_URL: z.string().url(),
    KEYCLOAK_AUDIENCE: z.string().min(1),

    STORAGE_ENDPOINT: z.string().url(),
    STORAGE_REGION: z.string().min(1).default('us-east-1'),
    STORAGE_BUCKET: z.string().min(1),
    STORAGE_ACCESS_KEY: z.string().min(1),
    STORAGE_SECRET_KEY: z.string().min(1),
    STORAGE_FORCE_PATH_STYLE: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),

    SWAGGER_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .passthrough();

export type ApiEnvironment = z.infer<typeof apiEnvSchema>;

export function validateEnvironment(config: Record<string, unknown>): ApiEnvironment {
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
