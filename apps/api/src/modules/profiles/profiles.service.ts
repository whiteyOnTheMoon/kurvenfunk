import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { FanPreferenceSelection } from '@kurvenfunk/validation';
import { BadRequestException, Injectable, type OnModuleDestroy } from '@nestjs/common';

export interface UserFanPreference {
  fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  favoriteClubId: string | null;
}

export interface CurrentProfile {
  id: string;
  nickname: string | null;
  displayName: string | null;
  bio: string | null;
  createdAt: Date;
  fanPreference: 'CLUB' | 'NEUTRAL' | 'UNSET';
  favoriteClub: {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
  } | null;
  avatar: {
    id: string;
    url: string;
    altText: string | null;
  } | null;
  community: {
    comments: number;
    threads: number;
    posts: number;
    reactions: number;
  };
}

@Injectable()
export class ProfilesService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async getCurrentProfile(userId: string): Promise<CurrentProfile> {
    const user = await this.database.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        id: true,
        nickname: true,
        createdAt: true,
        fanPreference: true,
        favoriteClub: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
          },
        },
        profile: {
          select: {
            displayName: true,
            bio: true,
            avatarMedia: {
              select: {
                id: true,
                url: true,
                altText: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            forumThreads: true,
            forumPosts: true,
            reactions: true,
          },
        },
      },
    });

    return {
      id: user.id,
      nickname: user.nickname,
      displayName: user.profile?.displayName ?? null,
      bio: user.profile?.bio ?? null,
      createdAt: user.createdAt,
      fanPreference: user.fanPreference,
      favoriteClub: user.favoriteClub,
      avatar: user.profile?.avatarMedia ?? null,
      community: {
        comments: user._count.comments,
        threads: user._count.forumThreads,
        posts: user._count.forumPosts,
        reactions: user._count.reactions,
      },
    };
  }

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
