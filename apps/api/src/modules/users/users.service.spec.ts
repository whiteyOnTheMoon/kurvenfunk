const upsert = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    user: {
      upsert,
    },
    $disconnect: disconnect,
  }),
}));

import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    upsert.mockReset();
    disconnect.mockReset();
    service = new UsersService();
  });

  it('syncs a Keycloak subject using an atomic upsert', async () => {
    upsert.mockResolvedValue({
      id: 'kurvenfunk-user-123',
      keycloakSubject: 'keycloak-subject-123',
      status: 'ACTIVE',
      onboardingCompleted: false,
      roleAssignments: [],
    });

    await expect(service.syncKeycloakUser('keycloak-subject-123')).resolves.toEqual({
      id: 'kurvenfunk-user-123',
      keycloakSubject: 'keycloak-subject-123',
      status: 'ACTIVE',
      onboardingCompleted: false,
      roles: [],
    });

    expect(upsert).toHaveBeenCalledWith({
      where: {
        keycloakSubject: 'keycloak-subject-123',
      },
      update: {},
      create: {
        keycloakSubject: 'keycloak-subject-123',
      },
      select: {
        id: true,
        keycloakSubject: true,
        status: true,
        fanPreference: true,
        favoriteClubId: true,
        onboardingCompleted: true,
        roleAssignments: {
          where: {
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: expect.any(Date) as Date,
                },
              },
            ],
          },
          select: {
            role: true,
          },
        },
      },
    });
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
