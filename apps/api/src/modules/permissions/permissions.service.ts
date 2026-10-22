import { Injectable } from '@nestjs/common';

import {
  LIMITED_PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
  type PermissionSubject,
  type PermissionRole,
} from './permissions.constants';

@Injectable()
export class PermissionsService {
  hasPermission(subject: PermissionSubject, permission: Permission): boolean {
    if (subject.status === 'BANNED') {
      return false;
    }

    if (subject.status === 'LIMITED' && !LIMITED_PERMISSIONS.has(permission)) {
      return false;
    }

    const roles: readonly PermissionRole[] = subject.roles.length > 0 ? subject.roles : ['USER'];

    return roles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
  }

  hasAllPermissions(subject: PermissionSubject, permissions: readonly Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(subject, permission));
  }
}
