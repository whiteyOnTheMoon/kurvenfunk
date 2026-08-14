import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

export interface SyncedUser {
  id: string;
  keycloakSubject: string;
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
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
