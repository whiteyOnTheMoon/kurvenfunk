export const QUEUE_NAMES = {
  TEST: 'test',
  NEWS_IMPORT: 'news-import',
  NEWS_IMPORT_DEAD_LETTER: 'news-import-dead-letter',
  SPORTS_IMPORT: 'sports-import',
  SPORTS_IMPORT_DEAD_LETTER: 'sports-import-dead-letter',
  SEARCH_INDEX: 'search-index',
  NOTIFICATIONS: 'notifications',
  SCHEDULED_PUBLISHING: 'scheduled-publishing',
  CLEANUP: 'cleanup',
  MODERATION: 'moderation',
  SANCTIONS: 'sanctions',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
/** Phase 23.225: queue payload contains only an immutable PostgreSQL UUID. */
export const NOTIFICATION_DISPATCH_JOB_NAME = 'process-notification-outbox' as const;

export interface NotificationDispatchJobPayload {
  notificationId: string;
}

import type { SportsProviderResource } from './sports-provider.js';

export const SPORTS_IMPORT_JOB_NAME = 'fetch-provider' as const;

export interface SportsImportJobPayload {
  /** Provider IDs are intentionally external, never Kurvenfunk UUIDs. */
  providerKey: string;
  resource: SportsProviderResource;
  competitionExternalId: string;
  seasonExternalId: string;
  windowStart?: string;
  windowEnd?: string;
}

export interface SportsImportDeadLetterPayload {
  originalQueue: typeof QUEUE_NAMES.SPORTS_IMPORT;
  originalJobId: string;
  originalJobName: typeof SPORTS_IMPORT_JOB_NAME;
  originalData: SportsImportJobPayload;
  errorCode: string;
  attemptsMade: number;
  failedAt: string;
}

export interface NewsImportJobPayload {
  providerKey: string;
  windowStart?: string;
  windowEnd?: string;
  lookbackMinutes?: number;
  /** Set only by a privileged manual dead-letter replay. */
  retryOfImportJobId?: string;
}

export interface NewsImportDeadLetterPayload {
  originalQueue: typeof QUEUE_NAMES.NEWS_IMPORT;
  originalJobId: string | null;
  originalJobName: string;
  originalData: NewsImportJobPayload;
  failedReason: string;
  attemptsMade: number;
  maxAttempts: number;
  failedAt: string;
}

export const APPLICATION_QUEUE_NAMES = [
  QUEUE_NAMES.NEWS_IMPORT,
  QUEUE_NAMES.SPORTS_IMPORT,
  QUEUE_NAMES.SEARCH_INDEX,
  QUEUE_NAMES.NOTIFICATIONS,
  QUEUE_NAMES.SCHEDULED_PUBLISHING,
  QUEUE_NAMES.CLEANUP,
  QUEUE_NAMES.MODERATION,
  QUEUE_NAMES.SANCTIONS,
] as const;

export const NEWS_IMPORT_RETRY_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2_000,
  },
} as const;

export const SPORTS_IMPORT_RETRY_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2_000 },
} as const;

export const DEFAULT_JOB_OPTIONS = {
  ...NEWS_IMPORT_RETRY_OPTIONS,
  removeOnComplete: {
    count: 1_000,
  },
  removeOnFail: {
    count: 5_000,
  },
} as const;
