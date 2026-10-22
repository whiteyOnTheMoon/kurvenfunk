import { z } from 'zod';

export const MAX_FILTER_TEXT_LENGTH = 200;
export const MAX_FILTER_VALUES = 50;

export const filterTextSchema = z.string().trim().min(1).max(MAX_FILTER_TEXT_LENGTH);

export const filterBooleanSchema = z.preprocess((value) => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}, z.boolean());

export const filterValuesSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string') {
      return value.split(',');
    }

    return value;
  },
  z.array(z.string().trim().min(1)).min(1).max(MAX_FILTER_VALUES),
);

export function createEnumFilterSchema<TValues extends readonly [string, ...string[]]>(
  values: TValues,
) {
  return z.enum(values);
}
