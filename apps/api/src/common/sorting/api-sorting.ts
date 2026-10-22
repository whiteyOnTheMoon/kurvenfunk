import { z } from 'zod';

export const SORT_ORDERS = ['asc', 'desc'] as const;

export const sortOrderSchema = z.enum(SORT_ORDERS);

export type SortOrder = z.infer<typeof sortOrderSchema>;

interface SortingSchemaOptions<TSortFields extends readonly [string, ...string[]]> {
  fields: TSortFields;
  defaultSortBy?: TSortFields[number];
  defaultSortOrder?: SortOrder;
}

export function createSortingQuerySchema<TSortFields extends readonly [string, ...string[]]>({
  fields,
  defaultSortBy,
  defaultSortOrder,
}: SortingSchemaOptions<TSortFields>) {
  const sortBySchema =
    defaultSortBy === undefined ? z.enum(fields).optional() : z.enum(fields).default(defaultSortBy);

  const orderSchema =
    defaultSortOrder === undefined
      ? sortOrderSchema.optional()
      : sortOrderSchema.default(defaultSortOrder);

  return z.strictObject({
    sortBy: sortBySchema,
    sortOrder: orderSchema,
  });
}
