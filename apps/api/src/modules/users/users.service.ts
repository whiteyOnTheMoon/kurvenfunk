import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

export interface SyncedUser {
  id: string;
  keycloakSubject: string;
  status: 'ACTIVE' | 'LIMITED' | 'BANNED';
  fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  favoriteClubId: string | null;
  onboardingCompleted: boolean;
}

@Injectable()
export class UsersService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async syncKeycloakUser(keycloakSubject: string): Promise<SyncedUser> {
    return this.database.user.upsert({
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
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
