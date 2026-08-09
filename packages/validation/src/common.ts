import { z } from 'zod';

export const entityIdSchema = z.string().min(1);

export const timestampSchema = z.iso.datetime();

export const nonEmptyStringSchema = z.string().trim().min(1);

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
