import { createPrismaClient, Prisma, type DatabaseClient } from '@kurvenfunk/database';
import type { CompleteOnboardingInput } from '@kurvenfunk/validation';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  type OnModuleDestroy,
} from '@nestjs/common';

export interface NicknameSelection {
  id: string;
  nickname: string;
}

export interface NicknameAvailability {
  available: boolean;
  nickname: string;
}

export interface OnboardingCompletion {
  id: string;
  nickname: string;
  fanPreference: 'CLUB' | 'NEUTRAL';
  favoriteClubId: string | null;
  onboardingCompleted: boolean;
}

@Injectable()
export class OnboardingService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async checkNicknameAvailability(userId: string, nickname: string): Promise<NicknameAvailability> {
    const existingUser = await this.database.user.findFirst({
      where: {
        nickname: {
          equals: nickname,
          mode: 'insensitive',
        },
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
      },
    });

    return {
      available: existingUser === null,
      nickname,
    };
  }

  async selectNickname(userId: string, nickname: string): Promise<NicknameSelection> {
    try {
      return (await this.database.user.update({
        where: {
          id: userId,
        },
        data: {
          nickname,
        },
        select: {
          id: true,
          nickname: true,
        },
      })) as NicknameSelection;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: 'NICKNAME_TAKEN',
          message: 'Nickname is already taken',
        });
      }

      throw error;
    }
  }

  async completeOnboarding(
    userId: string,
    input: CompleteOnboardingInput,
  ): Promise<OnboardingCompletion> {
    const nicknameAvailability = await this.checkNicknameAvailability(userId, input.nickname);

    if (!nicknameAvailability.available) {
      throw new ConflictException({
        code: 'NICKNAME_TAKEN',
        message: 'Nickname is already taken',
      });
    }

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

    try {
      return (await this.database.user.update({
        where: {
          id: userId,
        },
        data: {
          nickname: input.nickname,
          fanPreference: input.fanPreference,
          favoriteClubId: input.favoriteClubId,
          onboardingCompleted: true,
        },
        select: {
          id: true,
          nickname: true,
          fanPreference: true,
          favoriteClubId: true,
          onboardingCompleted: true,
        },
      })) as OnboardingCompletion;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: 'NICKNAME_TAKEN',
          message: 'Nickname is already taken',
        });
      }

      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
