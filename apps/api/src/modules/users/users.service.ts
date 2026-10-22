import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

export interface SyncedUser {
  id: string;
  keycloakSubject: string;
  status: 'ACTIVE' | 'LIMITED' | 'BANNED';
  fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  favoriteClubId: string | null;
  onboardingCompleted: boolean;
  roles: ('USER' | 'TRUSTED_USER' | 'MODERATOR' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN')[];
}

@Injectable()
export class UsersService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async syncKeycloakUser(keycloakSubject: string): Promise<SyncedUser> {
    const user = await this.database.user.upsert({
      where: {
        keycloakSubject,
      },
      update: {},
      create: {
        keycloakSubject,
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
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          select: {
            role: true,
          },
        },
      },
    });

    return {
      id: user.id,
      keycloakSubject: user.keycloakSubject,
      status: user.status,
      fanPreference: user.fanPreference,
      favoriteClubId: user.favoriteClubId,
      onboardingCompleted: user.onboardingCompleted,
      roles: user.roleAssignments.map((assignment) => assignment.role),
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
