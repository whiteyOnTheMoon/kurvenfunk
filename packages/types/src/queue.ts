export const QUEUE_NAMES = {
  TEST: 'test',
  NEWS_IMPORT: 'news-import',
  SPORTS_IMPORT: 'sports-import',
  SEARCH_INDEX: 'search-index',
  NOTIFICATIONS: 'notifications',
  SCHEDULED_PUBLISHING: 'scheduled-publishing',
  CLEANUP: 'cleanup',
  MODERATION: 'moderation',
  SANCTIONS: 'sanctions',
} as const;

export type QueueName =
  (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

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

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2_000,
  },
  removeOnComplete: {
    count: 1_000,
  },
  removeOnFail: {
    count: 5_000,
  },
} as const;
