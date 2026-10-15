import type { ExecutionContext } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

jest.mock('../users/users.service', () => ({
  UsersService: class UsersService {},
}));

jest.mock('./keycloak-jwt.service', () => ({
  KeycloakJwtService: class KeycloakJwtService {},
}));

import { UsersService } from '../users/users.service';
import { AccountStatusGuard } from './account-status.guard';
import { AuthGuard } from './auth.guard';
import { AuthModule } from './auth.module';
import { KeycloakJwtService } from './keycloak-jwt.service';

describe('Account status integration', () => {
  const verifyAccessToken = jest.fn();
  const syncKeycloakUser = jest.fn();

  let moduleRef: TestingModule;
  let authGuard: AuthGuard;

  function createContext(): ExecutionContext {
    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(async () => {
    verifyAccessToken.mockReset();
    syncKeycloakUser.mockReset();

    verifyAccessToken.mockResolvedValue({
      sub: 'test-subject',
      email_verified: true,
    });

    moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(KeycloakJwtService)
      .useValue({ verifyAccessToken })
      .overrideProvider(UsersService)
      .useValue({ syncKeycloakUser })
      .compile();

    authGuard = moduleRef.get(AuthGuard);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('resolves AuthGuard through NestJS dependency injection', () => {
    expect(authGuard).toBeInstanceOf(AuthGuard);
  });

  it('resolves AccountStatusGuard from AuthModule', () => {
    expect(moduleRef.get(AccountStatusGuard)).toBeInstanceOf(AccountStatusGuard);
  });

  it.each(['ACTIVE', 'LIMITED'] as const)(
    'allows %s accounts through authentication',
    async (status) => {
      syncKeycloakUser.mockResolvedValue({
        id: 'test-user',
        keycloakSubject: 'test-subject',
        status,
        fanPreference: 'NEUTRAL',
        favoriteClubId: null,
        onboardingCompleted: true,
        roles: ['USER'],
      });

      await expect(authGuard.canActivate(createContext())).resolves.toBe(true);
    },
  );

  it('blocks BANNED accounts through the integrated guard', async () => {
    syncKeycloakUser.mockResolvedValue({
      id: 'test-user',
      keycloakSubject: 'test-subject',
      status: 'BANNED',
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
      onboardingCompleted: true,
      roles: ['USER'],
    });

    await expect(authGuard.canActivate(createContext())).rejects.toMatchObject({
      response: {
        code: 'ACCOUNT_BANNED',
        message: 'Account is banned',
      },
      status: 403,
    });
  });
});
