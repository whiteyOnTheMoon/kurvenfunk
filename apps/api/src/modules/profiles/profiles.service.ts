import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { FanPreferenceSelection } from '@kurvenfunk/validation';
import { BadRequestException, Injectable, type OnModuleDestroy } from '@nestjs/common';

export interface UserFanPreference {
  fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  favoriteClubId: string | null;
}

@Injectable()
export class ProfilesService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async getFanPreference(userId: string): Promise<UserFanPreference> {
    return this.database.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        fanPreference: true,
        favoriteClubId: true,
      },
    });
  }

  async updateFanPreference(
    userId: string,
    input: FanPreferenceSelection,
  ): Promise<UserFanPreference> {
    if (input.fanPreference === 'CLUB') {
      const club = await this.database.club.findFirst({
        where: {
          id: input.favoriteClubId,
          active: true,
        },
        select: {
          id: true,
        },
      });

      if (!club) {
        throw new BadRequestException({
          code: 'INVALID_FAVORITE_CLUB',
          message: 'Favorite club does not exist or is inactive',
        });
      }
    }

    return this.database.user.update({
      where: {
        id: userId,
      },
      data: {
        fanPreference: input.fanPreference,
        favoriteClubId: input.favoriteClubId,
      },
      select: {
        fanPreference: true,
        favoriteClubId: true,
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
