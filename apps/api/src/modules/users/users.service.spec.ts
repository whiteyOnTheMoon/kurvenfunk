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
    });

    await expect(
      service.syncKeycloakUser('keycloak-subject-123'),
    ).resolves.toEqual({
      id: 'kurvenfunk-user-123',
      keycloakSubject: 'keycloak-subject-123',
      status: 'ACTIVE',
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
      },
    });
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
