import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PERMISSIONS, ROLE_PERMISSIONS } from '../permissions/permissions.constants';

const controller = readFileSync(join(__dirname, 'forums.controller.ts'), 'utf8');

describe('Phase 22.209 forum category authorization', () => {
  it('requires the forum.manage permission on every administrative route', () => {
    expect(controller).toMatch(
      /@Get\('categories\/admin\/all'\)\s+@RequirePermissions\(PERMISSIONS\.FORUM_MANAGE\)/,
    );
    expect(controller).toMatch(
      /@Post\('categories'\)\s+@RequirePermissions\(PERMISSIONS\.FORUM_MANAGE\)/,
    );
    expect(controller).toMatch(
      /@Patch\('categories\/:id'\)\s+@RequirePermissions\(PERMISSIONS\.FORUM_MANAGE\)/,
    );
  });

  it('grants forum management to administrators but not ordinary users or moderators', () => {
    expect(ROLE_PERMISSIONS.USER).not.toContain(PERMISSIONS.FORUM_MANAGE);
    expect(ROLE_PERMISSIONS.TRUSTED_USER).not.toContain(PERMISSIONS.FORUM_MANAGE);
    expect(ROLE_PERMISSIONS.MODERATOR).not.toContain(PERMISSIONS.FORUM_MANAGE);
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.FORUM_MANAGE);
    expect(ROLE_PERMISSIONS.SUPERADMIN).toContain(PERMISSIONS.FORUM_MANAGE);
  });
});
