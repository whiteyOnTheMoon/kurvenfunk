import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

jest.mock('./keycloak-jwt.service', () => ({
  KeycloakJwtService: class KeycloakJwtService {},
}));

import { AuthGuard } from './auth.guard';
import type { KeycloakJwtService } from './keycloak-jwt.service';

describe('AuthGuard', () => {
  const verifyAccessToken = jest.fn();

  const keycloakJwtService = {
    verifyAccessToken,
  } as unknown as KeycloakJwtService;

  const guard = new AuthGuard(keycloakJwtService);

  function createContext(authorization?: string): ExecutionContext {
    const request = {
      headers: authorization ? { authorization } : {},
    } as Request;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    verifyAccessToken.mockReset();
  });

  it('accepts a valid bearer token', async () => {
    verifyAccessToken.mockResolvedValue({
      sub: 'user-123',
    });

    const context = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
  });

  it('attaches verified claims to the request', async () => {
    verifyAccessToken.mockResolvedValue({
      sub: 'user-123',
      preferred_username: 'test-user',
    });

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request & {
      user?: {
        sub: string;
        preferred_username?: string;
      };
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    await guard.canActivate(context);

    expect(request.user).toEqual({
      sub: 'user-123',
      preferred_username: 'test-user',
    });
  });

  it('rejects a missing authorization header', async () => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects a non-bearer authorization header', async () => {
    await expect(
      guard.canActivate(createContext('Basic credentials')),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects malformed bearer headers', async () => {
    await expect(
      guard.canActivate(createContext('Bearer token extra')),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('propagates invalid token rejection', async () => {
    verifyAccessToken.mockRejectedValue(
      new UnauthorizedException('Invalid or expired access token'),
    );

    await expect(
      guard.canActivate(createContext('Bearer invalid-token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a verified token without a subject', async () => {
    verifyAccessToken.mockResolvedValue({});

    await expect(
      guard.canActivate(createContext('Bearer valid-token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
