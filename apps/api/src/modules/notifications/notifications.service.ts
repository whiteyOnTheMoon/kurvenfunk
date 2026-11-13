import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import {
  isNotificationKind,
  NOTIFICATION_TYPE_POLICIES,
  type NotificationKind,
  type NotificationSourceKind,
} from '@kurvenfunk/types';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  type OnModuleDestroy,
} from '@nestjs/common';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENT_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,119}$/;

export interface PersistNotificationCommand {
  userId: string;
  type: NotificationKind;
  eventKey: string;
  sourceType: NotificationSourceKind | null;
  sourceId: string | null;
  actorUserId?: string | null;
  url?: string | null;
}

export type PersistNotificationResult =
  { status: 'CREATED' | 'ALREADY_EXISTS'; id: string } | { status: 'SKIPPED_SELF'; id: null };

function invalid(code: string): BadRequestException {
  return new BadRequestException({
    code,
    message: 'Benachrichtigung enthält ungültige Ereignisdaten.',
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function safeInternalUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) return false;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return false;
  }
  if (/\s/.test(value)) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 32 || code === 127) return false;
  }
  try {
    return new URL(value, 'https://kurvenfunk.invalid').origin === 'https://kurvenfunk.invalid';
  } catch {
    return false;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

/**
 * Internal-only initial producer foundation. No public create endpoint,
 * delivery, demo data or queue dispatch until later Phase 23 slices.
 */
@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async persist(command: PersistNotificationCommand): Promise<PersistNotificationResult> {
    if (!isNotificationKind(command.type)) throw invalid('NOTIFICATION_TYPE_INVALID');
    if (!isUuid(command.userId)) throw invalid('NOTIFICATION_RECIPIENT_INVALID');
    if (!EVENT_KEY_PATTERN.test(command.eventKey)) throw invalid('NOTIFICATION_EVENT_KEY_INVALID');

    const policy = NOTIFICATION_TYPE_POLICIES[command.type];
    if (command.type === 'SYSTEM' && command.sourceType === null && command.sourceId === null) {
      // System messages may lack an associated domain record.
    } else if (
      !command.sourceType ||
      !policy.sourceTypes.some((sourceType) => sourceType === command.sourceType) ||
      !isUuid(command.sourceId)
    ) {
      throw invalid('NOTIFICATION_SOURCE_INVALID');
    }

    if (command.actorUserId !== null && command.actorUserId !== undefined) {
      if (!policy.showActor || !isUuid(command.actorUserId)) {
        throw invalid('NOTIFICATION_ACTOR_FORBIDDEN');
      }
    }
    if (command.url !== null && command.url !== undefined && !safeInternalUrl(command.url)) {
      throw invalid('NOTIFICATION_URL_INVALID');
    }
    if (policy.showActor && command.actorUserId === command.userId) {
      return { status: 'SKIPPED_SELF', id: null };
    }

    // The same recipient/event never generates a second notification on retry.
    const dedupeKey = ['notification', command.userId, command.type, command.eventKey].join(':');
    try {
      const notification = await this.database.$transaction(async (tx) => {
        const stored = await tx.notification.create({
        data: {
          userId: command.userId,
          type: command.type,
          title: policy.title,
          body: policy.body,
          url: command.url ?? null,
          sourceType: command.sourceType,
          sourceId: command.sourceId,
          actorUserId: command.actorUserId ?? null,
          dedupeKey,
        },
        select: { id: true },
        });
        await tx.notificationOutbox.create({ data: { notificationId: stored.id } });
        return stored;
      });
      return { status: 'CREATED', id: notification.id };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const previous = await this.database.notification.findUnique({
        where: { dedupeKey },
        select: {
          id: true,
          userId: true,
          type: true,
          sourceType: true,
          sourceId: true,
          actorUserId: true,
        },
      });
      if (
        !previous ||
        previous.userId !== command.userId ||
        previous.type !== command.type ||
        previous.sourceType !== command.sourceType ||
        previous.sourceId !== command.sourceId ||
        previous.actorUserId !== (command.actorUserId ?? null)
      ) {
        throw new ConflictException({
          code: 'NOTIFICATION_DEDUPE_CONFLICT',
          message: 'Das Benachrichtigungsereignis wurde widersprüchlich verarbeitet.',
        });
      }
      return { status: 'ALREADY_EXISTS', id: previous.id };
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}
