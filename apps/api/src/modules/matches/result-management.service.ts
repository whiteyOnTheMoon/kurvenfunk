import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { UpdateMatchResultInput } from '@kurvenfunk/validation';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

const resultSelect = {
  id: true,
  competitionId: true,
  seasonId: true,
  homeClubId: true,
  awayClubId: true,
  status: true,
  homeScore: true,
  awayScore: true,
  updatedAt: true,
} as const;

const allowedTransitions: Record<string, readonly string[]> = {
  SCHEDULED: ['LIVE', 'FINISHED', 'ABANDONED'],
  LIVE: ['LIVE', 'FINISHED', 'ABANDONED'],
  FINISHED: ['FINISHED'],
  ABANDONED: ['ABANDONED'],
  POSTPONED: [],
  CANCELLED: [],
};

function resultSnapshot(match: {
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  updatedAt: Date;
}) {
  return {
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    updatedAt: match.updatedAt.toISOString(),
  };
}

@Injectable()
export class ResultManagementService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async update(id: string, input: UpdateMatchResultInput, actorUserId: string) {
    return this.database.$transaction(async (tx) => {
      const previous = await tx.match.findUnique({
        where: { id },
        select: resultSelect,
      });
      if (!previous) {
        throw new NotFoundException({
          code: 'MATCH_NOT_FOUND',
          message: 'Spiel wurde nicht gefunden.',
        });
      }

      if (previous.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
        throw new ConflictException({
          code: 'MATCH_RESULT_STALE',
          message: 'Dieses Ergebnis wurde inzwischen geändert. Bitte neu laden.',
        });
      }

      if (!allowedTransitions[previous.status]?.includes(input.status)) {
        throw new ConflictException({
          code: 'MATCH_RESULT_TRANSITION_INVALID',
          message: 'Dieser Spielstatus erlaubt keine Ergebnisbearbeitung.',
        });
      }

      if (
        previous.status === input.status &&
        previous.homeScore === input.homeScore &&
        previous.awayScore === input.awayScore
      ) {
        return previous;
      }

      // Compare-and-swap prevents a stale admin edit overwriting a concurrent
      // sports import, fixture edit, or another result correction.
      const nextUpdatedAt = new Date(Math.max(Date.now(), previous.updatedAt.getTime() + 1));
      const changed = await tx.match.updateMany({
        where: {
          id,
          updatedAt: previous.updatedAt,
          status: previous.status,
        },
        data: {
          status: input.status,
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          updatedAt: nextUpdatedAt,
        },
      });
      if (changed.count !== 1) {
        throw new ConflictException({
          code: 'MATCH_RESULT_STALE',
          message: 'Dieses Ergebnis wurde inzwischen geändert. Bitte neu laden.',
        });
      }

      const updated = await tx.match.findUniqueOrThrow({
        where: { id },
        select: resultSelect,
      });

      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorUserId,
          action: 'ADMIN_CORRECTION',
          category: 'SYSTEM',
          targetType: 'SYSTEM',
          targetId: id,
          metadata: {
            entity: 'MATCH_RESULT',
            operation: 'UPDATE',
            competitionId: updated.competitionId,
            seasonId: updated.seasonId,
            homeClubId: updated.homeClubId,
            awayClubId: updated.awayClubId,
            before: resultSnapshot(previous),
            after: resultSnapshot(updated),
          },
        },
      });
      return updated;
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
