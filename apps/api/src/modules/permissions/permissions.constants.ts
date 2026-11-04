import type { AuthenticatedUser } from '../auth/auth.types';

export const PERMISSIONS = {
  COMMENT_CREATE: 'comment.create',
  COMMENT_EDIT: 'comment.edit',
  COMMENT_VOTE: 'comment.vote',
  COMMENT_DELETE: 'comment.delete',
  COMMENT_MODERATE: 'comment.moderate',

  THREAD_CREATE: 'thread.create',
  THREAD_REPLY: 'thread.reply',
  THREAD_LOCK: 'thread.lock',

  ARTICLE_CREATE: 'article.create',
  ARTICLE_PUBLISH: 'article.publish',

  USER_WARN: 'user.warn',
  USER_LIMIT: 'user.limit',
  USER_BAN: 'user.ban',
  USER_IPBAN: 'user.ipban',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type PermissionRole = AuthenticatedUser['kurvenfunkRoles'][number];

export type PermissionStatus = AuthenticatedUser['kurvenfunkUserStatus'];

export interface PermissionSubject {
  roles: readonly PermissionRole[];
  status: PermissionStatus;
}

export const REQUIRED_PERMISSIONS_METADATA_KEY = 'kurvenfunk:required-permissions';

export const COMMUNITY_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.COMMENT_CREATE,
  PERMISSIONS.COMMENT_EDIT,
  PERMISSIONS.COMMENT_VOTE,
  PERMISSIONS.COMMENT_DELETE,
  PERMISSIONS.THREAD_CREATE,
  PERMISSIONS.THREAD_REPLY,
];

const MODERATION_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.COMMENT_MODERATE,
  PERMISSIONS.THREAD_LOCK,
  PERMISSIONS.USER_WARN,
  PERMISSIONS.USER_LIMIT,
];

const EDITORIAL_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.ARTICLE_CREATE,
  PERMISSIONS.ARTICLE_PUBLISH,
];

export const ROLE_PERMISSIONS: Readonly<Record<PermissionRole, readonly Permission[]>> = {
  USER: COMMUNITY_PERMISSIONS,

  TRUSTED_USER: COMMUNITY_PERMISSIONS,

  MODERATOR: [...COMMUNITY_PERMISSIONS, ...MODERATION_PERMISSIONS],

  EDITOR: [...COMMUNITY_PERMISSIONS, ...EDITORIAL_PERMISSIONS],

  ADMIN: Object.values(PERMISSIONS).filter((permission) => permission !== PERMISSIONS.USER_IPBAN),

  SUPERADMIN: Object.values(PERMISSIONS),
};

// LIMITED may read public resources and vote, but cannot perform posting or
// moderation actions. Reads do not require a write permission.
export const LIMITED_PERMISSIONS: ReadonlySet<Permission> = new Set([PERMISSIONS.COMMENT_VOTE]);
