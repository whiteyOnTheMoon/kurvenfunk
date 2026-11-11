import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';
import { ForumsController } from './forums.controller';

describe('Phase 22.209 forum category authorization', () => {
  it('restricts administrative writes to the forum.manage permission', () => {
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_METADATA_KEY,
        ForumsController.prototype.createCategory,
      ),
    ).toEqual([PERMISSIONS.FORUM_MANAGE]);
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_METADATA_KEY,
        ForumsController.prototype.updateCategory,
      ),
    ).toEqual([PERMISSIONS.FORUM_MANAGE]);
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSIONS_METADATA_KEY,
        ForumsController.prototype.findAllCategoriesForAdmin,
      ),
    ).toEqual([PERMISSIONS.FORUM_MANAGE]);
  });

  it('grants forum management to administrators but not ordinary users or moderators', () => {
    expect(ROLE_PERMISSIONS.USER).not.toContain(PERMISSIONS.FORUM_MANAGE);
    expect(ROLE_PERMISSIONS.TRUSTED_USER).not.toContain(PERMISSIONS.FORUM_MANAGE);
    expect(ROLE_PERMISSIONS.MODERATOR).not.toContain(PERMISSIONS.FORUM_MANAGE);
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.FORUM_MANAGE);
    expect(ROLE_PERMISSIONS.SUPERADMIN).toContain(PERMISSIONS.FORUM_MANAGE);
  });
});
