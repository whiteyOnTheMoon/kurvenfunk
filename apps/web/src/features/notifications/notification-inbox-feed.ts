/**
 * Phase 23.226: strict client-only parsing for the authenticated inbox.
 * No user ID, browser storage, public cache or untrusted navigation URL.
 */
export interface InboxNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface InboxPage {
  items: InboxNotification[];
  pagination: { hasNextPage: boolean; nextCursor: string | null };
}

export type InboxFilter = 'all' | 'unread';

const notificationTypes = new Set([
  'COMMENT_REPLY',
  'THREAD_REPLY',
  'YELLOW_CARD',
  'BLUE_CARD',
  'RED_CARD',
  'LIMITED',
  'BAN',
  'APPEAL',
  'SYSTEM',
]);

const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function validDate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

export function safeNotificationHref(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  if (/\s/.test(value)) return null;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) return null;
  }
  try {
    const url = new URL(value, 'https://kurvenfunk.invalid');
    return url.origin === 'https://kurvenfunk.invalid' ? value : null;
  } catch {
    return null;
  }
}

function parseRow(value: unknown): InboxNotification {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('NOTIFICATION_RESPONSE_INVALID');
  }
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    !uuidPattern.test(row.id) ||
    !notificationTypes.has(String(row.type)) ||
    typeof row.title !== 'string' ||
    row.title.trim().length === 0 ||
    typeof row.body !== 'string' ||
    !validDate(row.createdAt) ||
    (row.readAt !== null && !validDate(row.readAt)) ||
    (row.url !== null && typeof row.url !== 'string')
  ) {
    throw new Error('NOTIFICATION_RESPONSE_INVALID');
  }
  return {
    id: row.id,
    type: String(row.type),
    title: row.title,
    body: row.body,
    url: safeNotificationHref(row.url),
    createdAt: row.createdAt,
    readAt: row.readAt,
  };
}

export function parseInboxPage(payload: unknown): InboxPage {
  if (!payload || typeof payload !== 'object') throw new Error('NOTIFICATION_RESPONSE_INVALID');
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object') throw new Error('NOTIFICATION_RESPONSE_INVALID');
  const page = data as { items?: unknown; pagination?: unknown };
  const pagination = page.pagination as { hasNextPage?: unknown; nextCursor?: unknown } | undefined;
  if (
    !Array.isArray(page.items) ||
    page.items.length > 50 ||
    !pagination ||
    typeof pagination.hasNextPage !== 'boolean' ||
    (pagination.hasNextPage
      ? typeof pagination.nextCursor !== 'string' || pagination.nextCursor.length === 0
      : pagination.nextCursor !== null)
  ) {
    throw new Error('NOTIFICATION_RESPONSE_INVALID');
  }
  const items = page.items.map(parseRow);
  return {
    items,
    pagination: {
      hasNextPage: pagination.hasNextPage,
      nextCursor: pagination.nextCursor as string | null,
    },
  };
}

export function parseUnreadCount(payload: unknown): number {
  if (!payload || typeof payload !== 'object') throw new Error('NOTIFICATION_COUNT_INVALID');
  const data = (payload as { data?: { count?: unknown } }).data;
  if (!data || !Number.isSafeInteger(data.count) || (data.count as number) < 0) {
    throw new Error('NOTIFICATION_COUNT_INVALID');
  }
  return data.count as number;
}

export async function fetchInboxPage(
  apiUrl: string,
  token: string,
  filter: InboxFilter,
  cursor?: string,
  signal?: AbortSignal,
): Promise<InboxPage> {
  if (!token) throw new Error('NOTIFICATION_AUTH_REQUIRED');
  const params = new URLSearchParams({ limit: '20', filter });
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(
    apiUrl.replace(/\/$/, '') + '/api/v1/notifications?' + params.toString(),
    {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store',
      signal,
    },
  );
  if (!response.ok) throw new Error('NOTIFICATION_REQUEST_FAILED');
  return parseInboxPage(await response.json());
}

export async function fetchUnreadCount(
  apiUrl: string,
  token: string,
  signal?: AbortSignal,
): Promise<number> {
  if (!token) throw new Error('NOTIFICATION_AUTH_REQUIRED');
  const response = await fetch(apiUrl.replace(/\/$/, '') + '/api/v1/notifications/unread-count', {
    headers: { Authorization: 'Bearer ' + token },
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error('NOTIFICATION_COUNT_FAILED');
  return parseUnreadCount(await response.json());
}

export function appendInboxPage(
  previous: InboxNotification[],
  incoming: InboxNotification[],
): InboxNotification[] {
  const seen = new Set(previous.map((item) => item.id));
  return [
    ...previous,
    ...incoming.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }),
  ];
}
