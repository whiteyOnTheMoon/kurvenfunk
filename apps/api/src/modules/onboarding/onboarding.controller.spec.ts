jest.mock('@kurvenfunk/validation', () => ({
  nicknameSchema: {
    safeParse: (value: unknown) => ({
      success: true,
      data: value,
    }),
  },
  selectNicknameSchema: {
    safeParse: (value: unknown) => ({
      success: true,
      data: value,
    }),
  },
}));

jest.mock('./onboarding.service', () => ({
  OnboardingService: class OnboardingService {},
}));

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: class AuthGuard {
    canActivate() {
      return true;
    }
  },
}));

import type { AuthenticatedRequest } from '../auth/auth.types';
import { OnboardingController } from './onboarding.controller';
import type { OnboardingService } from './onboarding.service';

describe('OnboardingController', () => {
  const selectNickname = jest.fn();
  const checkNicknameAvailability = jest.fn();

  const service = {
    selectNickname,
    checkNicknameAvailability,
  } as unknown as OnboardingService;

  const controller = new OnboardingController(service);

  beforeEach(() => {
    selectNickname.mockReset();
    checkNicknameAvailability.mockReset();
  });

  it('checks nickname availability for the authenticated Kurvenfunk user', async () => {
    checkNicknameAvailability.mockResolvedValue({
      available: true,
      nickname: 'RapidFan',
    });

    const request = {
      user: {
        sub: 'keycloak-user-123',
        kurvenfunkUserId: 'user-123',
        kurvenfunkUserStatus: 'ACTIVE',
        kurvenfunkOnboardingCompleted: false,
      },
    } as AuthenticatedRequest;

    await expect(controller.checkNicknameAvailability(request, 'RapidFan')).resolves.toEqual({
      available: true,
      nickname: 'RapidFan',
    });

    expect(checkNicknameAvailability).toHaveBeenCalledWith('user-123', 'RapidFan');
  });

  it('sets the nickname for the authenticated Kurvenfunk user', async () => {
    selectNickname.mockResolvedValue({
      id: 'user-123',
      nickname: 'RapidFan',
    });

    const request = {
      user: {
        sub: 'keycloak-user-123',
        kurvenfunkUserId: 'user-123',
        kurvenfunkUserStatus: 'ACTIVE',
        kurvenfunkOnboardingCompleted: false,
      },
    } as AuthenticatedRequest;

    await expect(
      controller.selectNickname(request, {
        nickname: 'RapidFan',
      }),
    ).resolves.toEqual({
      id: 'user-123',
      nickname: 'RapidFan',
    });

    expect(selectNickname).toHaveBeenCalledWith('user-123', 'RapidFan');
  });
});
