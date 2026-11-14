import { BadRequestException } from '@nestjs/common';

export type NotificationFilter = 'all' | 'unread';

export interface NotificationPageCursor {
  createdAt: Date;
  id: string;
  filter: NotificationFilter;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_CURSOR_LENGTH = 256;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function invalid(code: string): BadRequestException {
  return new BadRequestException({
    code,
    message: 'Ungültige Benachrichtigungsabfrage.',
  });
}

export function parseNotificationFilter(raw: unknown): NotificationFilter {
  if (raw === undefined || raw === 'all') return 'all';
  if (raw === 'unread') return 'unread';
  throw invalid('NOTIFICATION_FILTER_INVALID');
}

export function parseNotificationLimit(raw: unknown): number {
  if (raw === undefined) return DEFAULT_PAGE_SIZE;
  if (typeof raw !== 'string' || !/^[1-9]\d{0,1}$/.test(raw) || Number(raw) > MAX_PAGE_SIZE) {
    throw invalid('NOTIFICATION_LIMIT_INVALID');
  }
  return Number(raw);
}

/** An opaque seek cursor with no user identifier, token or content. */
export function encodeNotificationCursor(cursor: NotificationPageCursor): string {
  return Buffer.from(
    JSON.stringify({
      version: 1,
      createdAt: cursor.createdAt.toISOString(),
      id: cursor.id,
      filter: cursor.filter,
    }),
  ).toString('base64url');
}

export function parseNotificationCursor(
  raw: unknown,
  expectedFilter: NotificationFilter,
): NotificationPageCursor | null {
  if (raw === undefined) return null;
  if (
    typeof raw !== 'string' ||
    raw.length === 0 ||
    raw.length > MAX_CURSOR_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(raw)
  ) {
    throw invalid('NOTIFICATION_CURSOR_INVALID');
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid cursor');
    }
    const candidate = parsed as Record<string, unknown>;
    if (
      candidate.version !== 1 ||
      candidate.filter !== expectedFilter ||
      typeof candidate.id !== 'string' ||
      !UUID_PATTERN.test(candidate.id) ||
      typeof candidate.createdAt !== 'string' ||
      !ISO_PATTERN.test(candidate.createdAt)
    ) {
      throw new Error('Invalid cursor fields');
    }
    const createdAt = new Date(candidate.createdAt);
    if (!Number.isFinite(createdAt.valueOf()) || createdAt.toISOString() !== candidate.createdAt) {
      throw new Error('Invalid cursor timestamp');
    }
    return { id: candidate.id, filter: expectedFilter, createdAt };
  } catch {
    throw invalid('NOTIFICATION_CURSOR_INVALID');
  }
}
