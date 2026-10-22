import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.strictObject({
    name: z.string().trim().min(1),
    age: z.number().int().positive(),
  });

  const pipe = new ZodValidationPipe(schema);

  it('returns parsed and transformed input when validation succeeds', () => {
    expect(
      pipe.transform({
        name: '  Kurvenfunk  ',
        age: 41,
      }),
    ).toEqual({
      name: 'Kurvenfunk',
      age: 41,
    });
  });

  it('throws a validation error for invalid input', () => {
    expect(() =>
      pipe.transform({
        name: '',
        age: -1,
      }),
    ).toThrow(BadRequestException);
  });

  it('uses the standard validation error code', () => {
    try {
      pipe.transform({
        name: '',
        age: -1,
      });

      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);

      if (!(error instanceof BadRequestException)) {
        throw error;
      }

      const response = error.getResponse() as {
        code: string;
        message: string[];
      };

      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.message.some((message) => message.startsWith('name:'))).toBe(true);
      expect(response.message.some((message) => message.startsWith('age:'))).toBe(true);
    }
  });

  it('rejects unknown properties when a strict schema is used', () => {
    expect(() =>
      pipe.transform({
        name: 'Kurvenfunk',
        age: 41,
        unexpected: true,
      }),
    ).toThrow(BadRequestException);
  });
});
