jest.mock('../auth/auth.guard', () => ({
  AuthGuard: class {},
}));

jest.mock('../auth/onboarding-completed.guard', () => ({
  OnboardingCompletedGuard: class {},
}));

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: jest.fn(),
}));

import 'reflect-metadata';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../permissions/permissions.constants';
import { REQUIRED_PERMISSIONS_METADATA_KEY } from '../permissions/permissions.constants';
import { SportsCorrectionsController } from './sports-corrections.controller';

describe('SportsCorrectionsController authorization', () => {
  it('requires a dedicated correction permission for every route', () => {
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, SportsCorrectionsController),
    ).toEqual([PERMISSIONS.SPORTS_CORRECTION_MANAGE]);
  });

  it('grants correction only to administrators, not editors or moderators', () => {
    for (const role of ['USER', 'TRUSTED_USER', 'MODERATOR', 'EDITOR'] as const) {
      expect(ROLE_PERMISSIONS[role]).not.toContain(PERMISSIONS.SPORTS_CORRECTION_MANAGE);
    }
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.SPORTS_CORRECTION_MANAGE);
    expect(ROLE_PERMISSIONS.SUPERADMIN).toContain(PERMISSIONS.SPORTS_CORRECTION_MANAGE);
  });
});
