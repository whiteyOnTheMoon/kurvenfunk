import { SPORTS_PROVIDER_RESOURCES, type SportsImportJobPayload } from '@kurvenfunk/types';
import { z } from 'zod';

const utcTimestamp = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/)
  .refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 19) === value.slice(0, 19);
  });

const schema = z
  .object({
    providerKey: z.literal('fake-sports'),
    resource: z.enum(SPORTS_PROVIDER_RESOURCES),
    competitionExternalId: z.string().min(1).max(160),
    seasonExternalId: z.string().min(1).max(160),
    windowStart: utcTimestamp.optional(),
    windowEnd: utcTimestamp.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.windowStart === undefined ||
      value.windowEnd === undefined ||
      Date.parse(value.windowStart) <= Date.parse(value.windowEnd),
  );

/** Validate untrusted Redis job payloads without including their values in errors. */
export function parseSportsImportPayload(value: unknown): SportsImportJobPayload {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error('SPORTS_IMPORT_INVALID_PAYLOAD');
  return result.data;
}
