import { PERMISSIONS, type PermissionRole, type PermissionStatus } from './permissions.constants';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  const service = new PermissionsService();

  function can(
    permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
    roles: PermissionRole[],
    status: PermissionStatus = 'ACTIVE',
  ): boolean {
    return service.hasPermission({ roles, status }, permission);
  }

  it('treats an empty role list as USER', () => {
    expect(can(PERMISSIONS.COMMENT_CREATE, [])).toBe(true);
  });

  it.each(['USER', 'TRUSTED_USER', 'MODERATOR', 'EDITOR', 'ADMIN', 'SUPERADMIN'] as const)(
    'allows active %s to comment',
    (role) => {
      expect(can(PERMISSIONS.COMMENT_CREATE, [role])).toBe(true);
    },
  );

  it('allows LIMITED users to vote', () => {
    expect(can(PERMISSIONS.COMMENT_VOTE, ['USER'], 'LIMITED')).toBe(true);
  });

  it('blocks LIMITED users from deleting comments', () => {
    expect(can(PERMISSIONS.COMMENT_DELETE, ['USER'], 'LIMITED')).toBe(false);
  });

  it.each([
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_EDIT,
    PERMISSIONS.THREAD_CREATE,
    PERMISSIONS.THREAD_REPLY,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.USER_WARN,
    PERMISSIONS.USER_LIMIT,
    PERMISSIONS.USER_BAN,
    PERMISSIONS.USER_IPBAN,
    PERMISSIONS.ARTICLE_CREATE,
    PERMISSIONS.ARTICLE_PUBLISH,
  ] as const)('blocks LIMITED users from %s', (permission) => {
    expect(can(permission, ['USER'], 'LIMITED')).toBe(false);
    expect(can(permission, ['SUPERADMIN'], 'LIMITED')).toBe(false);
  });

  it('does not allow LIMITED users to bypass restrictions through elevated roles', () => {
    expect(can(PERMISSIONS.COMMENT_CREATE, ['MODERATOR'], 'LIMITED')).toBe(false);
    expect(can(PERMISSIONS.THREAD_REPLY, ['SUPERADMIN'], 'LIMITED')).toBe(false);
    expect(can(PERMISSIONS.COMMENT_VOTE, ['USER'], 'LIMITED')).toBe(true);
  });

  it('blocks LIMITED users from creating comments', () => {
    expect(can(PERMISSIONS.COMMENT_CREATE, ['USER'], 'LIMITED')).toBe(false);
  });

  it('blocks LIMITED users from creating threads', () => {
    expect(can(PERMISSIONS.THREAD_CREATE, ['USER'], 'LIMITED')).toBe(false);
  });

  it('blocks BANNED users from voting', () => {
    expect(can(PERMISSIONS.COMMENT_VOTE, ['USER'], 'BANNED')).toBe(false);
  });

  it('blocks BANNED superadmins', () => {
    expect(can(PERMISSIONS.USER_IPBAN, ['SUPERADMIN'], 'BANNED')).toBe(false);
  });

  it('allows moderators to moderate comments', () => {
    expect(can(PERMISSIONS.COMMENT_MODERATE, ['MODERATOR'])).toBe(true);
  });

  it('prevents normal users from moderating', () => {
    expect(can(PERMISSIONS.COMMENT_MODERATE, ['USER'])).toBe(false);
  });

  it('allows editors to publish articles', () => {
    expect(can(PERMISSIONS.ARTICLE_PUBLISH, ['EDITOR'])).toBe(true);
  });

  it('prevents moderators from publishing articles', () => {
    expect(can(PERMISSIONS.ARTICLE_PUBLISH, ['MODERATOR'])).toBe(false);
  });

  it('allows ADMIN to ban users', () => {
    expect(can(PERMISSIONS.USER_BAN, ['ADMIN'])).toBe(true);
  });

  it('reserves IP bans for SUPERADMIN', () => {
    expect(can(PERMISSIONS.USER_IPBAN, ['ADMIN'])).toBe(false);

    expect(can(PERMISSIONS.USER_IPBAN, ['SUPERADMIN'])).toBe(true);
  });

  it('combines permissions from multiple roles', () => {
    expect(can(PERMISSIONS.ARTICLE_PUBLISH, ['USER', 'EDITOR'])).toBe(true);

    expect(can(PERMISSIONS.COMMENT_MODERATE, ['EDITOR', 'MODERATOR'])).toBe(true);
  });

  it('requires all requested permissions', () => {
    expect(
      service.hasAllPermissions(
        {
          roles: ['EDITOR'],
          status: 'ACTIVE',
        },
        [PERMISSIONS.COMMENT_CREATE, PERMISSIONS.ARTICLE_PUBLISH],
      ),
    ).toBe(true);

    expect(
      service.hasAllPermissions(
        {
          roles: ['USER'],
          status: 'ACTIVE',
        },
        [PERMISSIONS.COMMENT_CREATE, PERMISSIONS.ARTICLE_PUBLISH],
      ),
    ).toBe(false);
  });
});
