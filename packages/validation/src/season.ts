import { z } from 'zod';

import { slugSchema } from './common.js';

export const seasonStatusSchema = z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']);

const seasonNameSchema = z.string().trim().min(1).max(80);
const seasonDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(value + 'T00:00:00.000Z');
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, 'A real calendar date in YYYY-MM-DD format is required');

export const createSeasonSchema = z
  .object({
    name: seasonNameSchema,
    slug: slugSchema.max(100),
    startDate: seasonDateSchema,
    endDate: seasonDateSchema,
    status: seasonStatusSchema.optional(),
  })
  .strict()
  .refine((input) => input.startDate <= input.endDate, {
    path: ['endDate'],
    message: 'End date must not precede start date',
  });

export const updateSeasonSchema = z
  .object({
    name: seasonNameSchema.optional(),
    startDate: seasonDateSchema.optional(),
    endDate: seasonDateSchema.optional(),
    status: seasonStatusSchema.optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'At least one field is required');

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
