import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorResponse } from '../types/api-error-response';
import type { RequestWithId } from '../types/request-with-id';

interface HttpExceptionResponse {
  code?: string;
  error?: string;
  message?: string | string[];
  statusCode?: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithId>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = this.getDefaultCode(status);
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        const structuredResponse = exceptionResponse as HttpExceptionResponse;

        if (structuredResponse.code) {
          code = structuredResponse.code;
        } else if (structuredResponse.error) {
          code = this.normalizeCode(structuredResponse.error);
        }

        if (structuredResponse.message) {
          message = structuredResponse.message;
        }
      }
    }

    const body: ApiErrorResponse = {
      code,
      message,
      requestId: request.requestId,
    };

    response.status(status).json(body);
  }

  private getDefaultCode(status: number): string {
    const statusName = HttpStatus[status];

    if (typeof statusName === 'string') {
      return this.normalizeCode(statusName);
    }

    return 'HTTP_ERROR';
  }

  private normalizeCode(value: string): string {
    return value
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  }
}
