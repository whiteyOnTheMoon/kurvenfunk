jest.mock('@kurvenfunk/validation', () => ({
  fanPreferenceSelectionSchema: {
    safeParse: (value: unknown) => ({
      success: true,
      data: value,
    }),
  },
}));

jest.mock('./profiles.service', () => ({
  ProfilesService: class ProfilesService {},
}));

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: class AuthGuard {
    canActivate() {
      return true;
    }
  },
}));

import type { AuthenticatedRequest } from '../auth/auth.types';
import { ProfilesController } from './profiles.controller';
import type { ProfilesService } from './profiles.service';

describe('ProfilesController', () => {
  const getFanPreference = jest.fn();
  const updateFanPreference = jest.fn();

  const service = {
    getFanPreference,
    updateFanPreference,
  } as unknown as ProfilesService;

  const controller = new ProfilesController(service);

  const request = {
    user: {
      sub: 'keycloak-user-123',
      kurvenfunkUserId: 'user-123',
      kurvenfunkUserStatus: 'ACTIVE',
      kurvenfunkOnboardingCompleted: true,
    },
  } as AuthenticatedRequest;

  beforeEach(() => {
    getFanPreference.mockReset();
    updateFanPreference.mockReset();
  });

  it('returns the current fan preference for the authenticated user', async () => {
    getFanPreference.mockResolvedValue({
      fanPreference: 'CLUB',
      favoriteClubId: '11111111-1111-4111-8111-111111111111',
    });

    await expect(controller.getFanPreference(request)).resolves.toEqual({
      fanPreference: 'CLUB',
      favoriteClubId: '11111111-1111-4111-8111-111111111111',
    });

    expect(getFanPreference).toHaveBeenCalledWith('user-123');
  });

  it('updates the fan preference for the authenticated user', async () => {
    const input = {
      fanPreference: 'NEUTRAL' as const,
      favoriteClubId: null,
    };

    updateFanPreference.mockResolvedValue(input);

    await expect(controller.updateFanPreference(request, input)).resolves.toEqual(input);

    expect(updateFanPreference).toHaveBeenCalledWith('user-123', input);
  });
});
