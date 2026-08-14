import { ForbiddenException, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

jest.mock('./keycloak-jwt.service', () => ({
  KeycloakJwtService: class KeycloakJwtService {},
}));

jest.mock('../users/users.service', () => ({
  UsersService: class UsersService {},
}));

import { UsersService } from '../users/users.service';
import { AuthGuard } from './auth.guard';
import type { KeycloakJwtService } from './keycloak-jwt.service';

describe('AuthGuard', () => {
  const verifyAccessToken = jest.fn();
  const syncKeycloakUser = jest.fn();

  const keycloakJwtService = {
    verifyAccessToken,
  } as unknown as KeycloakJwtService;

  const usersService = {
    syncKeycloakUser,
  } as unknown as UsersService;

  const guard = new AuthGuard(keycloakJwtService, usersService);

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
    syncKeycloakUser.mockReset();

    syncKeycloakUser.mockResolvedValue({
      id: 'kurvenfunk-user-123',
      keycloakSubject: 'user-123',
      status: 'ACTIVE',
      onboardingCompleted: false,
    });
  });

  it('accepts a valid bearer token', async () => {
    verifyAccessToken.mockResolvedValue({
      sub: 'user-123',
      email_verified: true,
    });

    const context = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(syncKeycloakUser).toHaveBeenCalledWith('user-123');
  });

  it('attaches verified claims and the Kurvenfunk user id to the request', async () => {
    verifyAccessToken.mockResolvedValue({
      sub: 'user-123',
      email_verified: true,
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
        kurvenfunkUserId: string;
        kurvenfunkUserStatus: 'ACTIVE' | 'LIMITED' | 'BANNED';
        kurvenfunkOnboardingCompleted: boolean;
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
      email_verified: true,
      preferred_username: 'test-user',
      kurvenfunkUserId: 'kurvenfunk-user-123',
      kurvenfunkUserStatus: 'ACTIVE',
      kurvenfunkOnboardingCompleted: false,
    });
  });

  it('allows a LIMITED user to authenticate', async () => {
    verifyAccessToken.mockResolvedValue({
      sub: 'user-123',
      email_verified: true,
    });

    syncKeycloakUser.mockResolvedValue({
      id: 'kurvenfunk-user-123',
      keycloakSubject: 'user-123',
      status: 'LIMITED',
      onboardingCompleted: false,
    });

    await expect(guard.canActivate(createContext('Bearer valid-token'))).resolves.toBe(true);
  });

  it('rejects a BANNED user', async () => {
    verifyAccessToken.mockResolvedValue({
      sub: 'user-123',
      email_verified: true,
    });

    syncKeycloakUser.mockResolvedValue({
      id: 'kurvenfunk-user-123',
      keycloakSubject: 'user-123',
      status: 'BANNED',
      onboardingCompleted: false,
    });

    await expect(guard.canActivate(createContext('Bearer valid-token'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects a missing authorization header', async () => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(UnauthorizedException);

    expect(verifyAccessToken).not.toHaveBeenCalled();
    expect(syncKeycloakUser).not.toHaveBeenCalled();
  });

  it('rejects a non-bearer authorization header', async () => {
    await expect(guard.canActivate(createContext('Basic credentials'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(verifyAccessToken).not.toHaveBeenCalled();
    expect(syncKeycloakUser).not.toHaveBeenCalled();
  });

  it('rejects malformed bearer headers', async () => {
    await expect(guard.canActivate(createContext('Bearer token extra'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(verifyAccessToken).not.toHaveBeenCalled();
    expect(syncKeycloakUser).not.toHaveBeenCalled();
  });

  it('propagates invalid token rejection', async () => {
    verifyAccessToken.mockRejectedValue(
      new UnauthorizedException('Invalid or expired access token'),
    );

    await expect(guard.canActivate(createContext('Bearer invalid-token'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(syncKeycloakUser).not.toHaveBeenCalled();
  });

  it('rejects a token for an unverified email address', async () => {
    verifyAccessToken.mockResolvedValue({
      sub: 'user-123',
      email_verified: false,
    });

    await expect(guard.canActivate(createContext('Bearer valid-token'))).rejects.toThrow(
      'Email address is not verified',
    );

    expect(syncKeycloakUser).not.toHaveBeenCalled();
  });

  it('rejects a token without an email verification claim', async () => {
    verifyAccessToken.mockResolvedValue({
      sub: 'user-123',
    });

    await expect(guard.canActivate(createContext('Bearer valid-token'))).rejects.toThrow(
      'Email address is not verified',
    );

    expect(syncKeycloakUser).not.toHaveBeenCalled();
  });

  it('rejects a verified token without a subject', async () => {
    verifyAccessToken.mockResolvedValue({});

    await expect(guard.canActivate(createContext('Bearer valid-token'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(syncKeycloakUser).not.toHaveBeenCalled();
  });
});
