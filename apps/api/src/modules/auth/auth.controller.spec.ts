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
        kurvenfunkOnboardingCompleted: false,
      },
    } as AuthenticatedRequest;

    expect(controller.getCurrentUser(request)).toEqual({
      id: 'kurvenfunk-user-123',
      status: 'LIMITED',
      subject: 'keycloak-user-123',
      onboardingCompleted: false,
    });
  });
});
