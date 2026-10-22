import { z } from 'zod';

const webEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    WEB_URL: z.url(),
    API_URL: z.url(),
    AUTH_URL: z.url(),
  })
  .passthrough();

export type WebEnvironment = z.infer<typeof webEnvSchema>;

function validateEnvironment(): WebEnvironment {
  const result = webEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    WEB_URL: process.env.WEB_URL,
    API_URL: process.env.API_URL,
    AUTH_URL: process.env.AUTH_URL,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const field = issue.path.join('.') || 'environment';
        return `- ${field}: ${issue.message}`;
      })
      .join('\n');

    throw new Error(`Web environment validation failed:\n${errors}`);
  }

  return result.data;
}

export const env = validateEnvironment();
