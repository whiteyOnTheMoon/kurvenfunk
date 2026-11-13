/**
 * Phase 23.224: the shared application notification taxonomy.
 * Values must match Prisma NotificationType / NotificationSourceType.
 */
export const NOTIFICATION_TYPES = [
  'COMMENT_REPLY',
  'THREAD_REPLY',
  'YELLOW_CARD',
  'BLUE_CARD',
  'RED_CARD',
  'LIMITED',
  'BAN',
  'APPEAL',
  'SYSTEM',
] as const;

export type NotificationKind = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_SOURCE_TYPES = [
  'COMMENT',
  'POST',
  'THREAD',
  'MODERATION_CARD',
  'SANCTION',
  'APPEAL',
  'SYSTEM',
] as const;

export type NotificationSourceKind = (typeof NOTIFICATION_SOURCE_TYPES)[number];

interface NotificationTypePolicy {
  readonly sourceTypes: readonly NotificationSourceKind[];
  readonly mandatoryInApp: boolean;
  readonly showActor: boolean;
  readonly title: string;
  readonly body: string;
}

/** Static, recipient-safe copy: never interpolate private moderator notes or raw post text. */
export const NOTIFICATION_TYPE_POLICIES = {
  COMMENT_REPLY: {
    sourceTypes: ['COMMENT'],
    mandatoryInApp: false,
    showActor: true,
    title: 'Neue Antwort',
    body: 'Jemand hat auf deinen Kommentar geantwortet.',
  },
  THREAD_REPLY: {
    sourceTypes: ['POST', 'THREAD'],
    mandatoryInApp: false,
    showActor: true,
    title: 'Aktivität im Forum',
    body: 'In einer abonnierten Diskussion gibt es neue Beiträge.',
  },
  YELLOW_CARD: {
    sourceTypes: ['MODERATION_CARD'],
    mandatoryInApp: true,
    showActor: false,
    title: 'Moderationshinweis',
    body: 'Für deinen Account wurde eine gelbe Karte erfasst.',
  },
  BLUE_CARD: {
    sourceTypes: ['MODERATION_CARD'],
    mandatoryInApp: true,
    showActor: false,
    title: 'Moderationshinweis',
    body: 'Für deinen Account wurde eine blaue Karte erfasst.',
  },
  RED_CARD: {
    sourceTypes: ['MODERATION_CARD'],
    mandatoryInApp: true,
    showActor: false,
    title: 'Moderationshinweis',
    body: 'Für deinen Account wurde eine rote Karte erfasst.',
  },
  LIMITED: {
    sourceTypes: ['SANCTION'],
    mandatoryInApp: true,
    showActor: false,
    title: 'Account-Einschränkung',
    body: 'Dein Account wurde eingeschränkt. Weitere Informationen findest du in deinem Account.',
  },
  BAN: {
    sourceTypes: ['SANCTION'],
    mandatoryInApp: true,
    showActor: false,
    title: 'Account-Sperre',
    body: 'Dein Account wurde gesperrt. Weitere Informationen erhältst du über die vorgesehenen Kontaktwege.',
  },
  APPEAL: {
    sourceTypes: ['APPEAL'],
    mandatoryInApp: false,
    showActor: false,
    title: 'Einspruch',
    body: 'Der Status deines Einspruchs wurde aktualisiert.',
  },
  SYSTEM: {
    sourceTypes: ['SYSTEM'],
    mandatoryInApp: false,
    showActor: false,
    title: 'Mitteilung',
    body: 'Es gibt eine neue Mitteilung von Kurvenfunk.',
  },
} as const satisfies Record<NotificationKind, NotificationTypePolicy>;

export function isNotificationKind(value: unknown): value is NotificationKind {
  return typeof value === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(value);
}
