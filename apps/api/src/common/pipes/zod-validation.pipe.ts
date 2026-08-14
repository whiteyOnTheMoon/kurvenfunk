import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => {
        const path = issue.path.join('.');

        return path ? `${path}: ${issue.message}` : issue.message;
      });

      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: messages,
      });
    }

    return result.data;
  }
}
