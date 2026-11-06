jest.mock('./auth.guard', () => ({
  AuthGuard: class AuthGuard {
    canActivate() {
      return true;
    }
  },
}));

import type { AuthenticatedRequest } from './auth.types';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const controller = new AuthController();

  it('returns the authenticated Kurvenfunk user', () => {
    const request = {
      user: {
        sub: 'keycloak-user-123',
        kurvenfunkUserId: 'kurvenfunk-user-123',
        kurvenfunkUserStatus: 'LIMITED',
        kurvenfunkRoles: ['EDITOR'],
        kurvenfunkFanPreference: 'CLUB',
        kurvenfunkFavoriteClubId: '11111111-1111-4111-8111-111111111111',
        kurvenfunkOnboardingCompleted: false,
      },
    } as AuthenticatedRequest;

    expect(controller.getCurrentUser(request)).toEqual({
      id: 'kurvenfunk-user-123',
      status: 'LIMITED',
      roles: ['EDITOR'],
      subject: 'keycloak-user-123',
      fanPreference: 'CLUB',
      favoriteClubId: '11111111-1111-4111-8111-111111111111',
      onboardingCompleted: false,
    });
  });
});
