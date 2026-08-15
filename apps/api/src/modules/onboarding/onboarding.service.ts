import { createPrismaClient, Prisma, type DatabaseClient } from '@kurvenfunk/database';
import { ConflictException, Injectable, type OnModuleDestroy } from '@nestjs/common';

export interface NicknameSelection {
  id: string;
  nickname: string;
}

export interface NicknameAvailability {
  available: boolean;
  nickname: string;
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

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
