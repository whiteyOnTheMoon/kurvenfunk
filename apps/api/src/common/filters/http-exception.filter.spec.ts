import { BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const requestId = '11111111-1111-4111-8111-111111111111';

  function createHost() {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    const response = {
      status,
      json,
    } as unknown as Response;

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({
          requestId,
        }),
      }),
    } as unknown as ArgumentsHost;

    return {
      host,
      status,
      json,
    };
  }

  it('formats a standard HTTP exception', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost();

    filter.catch(new NotFoundException('Resource not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: 'Resource not found',
      requestId,
    });
  });

  it('preserves validation message arrays', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost();

    filter.catch(
      new BadRequestException({
        message: ['name must be a string', 'name should not be empty'],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      code: 'BAD_REQUEST',
      message: ['name must be a string', 'name should not be empty'],
      requestId,
    });
  });

  it('preserves an explicit application error code', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost();

    filter.catch(
      new HttpException(
        {
          code: 'NICKNAME_ALREADY_TAKEN',
          message: 'Nickname is already taken',
        },
        HttpStatus.CONFLICT,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      code: 'NICKNAME_ALREADY_TAKEN',
      message: 'Nickname is already taken',
      requestId,
    });
  });

  it('hides unexpected internal error details', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost();

    filter.catch(new Error('Database password leaked here'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      requestId,
    });
  });
});
