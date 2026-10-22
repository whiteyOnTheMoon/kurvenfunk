import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants';

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn(),
}));

jest.mock('../articles/articles.service', () => ({
  ArticlesService: jest.fn(),
}));

jest.mock('@kurvenfunk/validation', () => ({
  createArticleSchema: {},
  updateArticleSchema: {},
  articlePublicationWorkflowSchema: {},
}));

import { ArticlesController } from '../articles/articles.controller';
import { AuthGuard } from '../auth/auth.guard';

import { PERMISSIONS, REQUIRED_PERMISSIONS_METADATA_KEY } from './permissions.constants';

import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';

describe('Article publication permissions', () => {
  function getHandler(methodName: string): object {
    const handler: unknown = Object.getOwnPropertyDescriptor(
      ArticlesController.prototype,
      methodName,
    )?.value;

    if (typeof handler !== 'function') {
      throw new Error(`Missing article method: ${methodName}`);
    }

    return handler;
  }

  it('requires article.publish for publication changes', () => {
    const handler = getHandler('changePublicationStatus');

    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler)).toEqual([
      PERMISSIONS.ARTICLE_PUBLISH,
    ]);
  });

  it('applies authentication and permission guards', () => {
    const handler = getHandler('changePublicationStatus');

    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([AuthGuard, PermissionsGuard]);
  });

  it('allows active editors to publish', () => {
    const service = new PermissionsService();

    expect(
      service.hasPermission(
        {
          roles: ['EDITOR'],
          status: 'ACTIVE',
        },
        PERMISSIONS.ARTICLE_PUBLISH,
      ),
    ).toBe(true);
  });

  it('rejects users without publication permission', () => {
    const service = new PermissionsService();

    expect(
      service.hasPermission(
        {
          roles: ['USER'],
          status: 'ACTIVE',
        },
        PERMISSIONS.ARTICLE_PUBLISH,
      ),
    ).toBe(false);
  });

  it('rejects limited editors', () => {
    const service = new PermissionsService();

    expect(
      service.hasPermission(
        {
          roles: ['EDITOR'],
          status: 'LIMITED',
        },
        PERMISSIONS.ARTICLE_PUBLISH,
      ),
    ).toBe(false);
  });

  it('rejects banned superadmins', () => {
    const service = new PermissionsService();

    expect(
      service.hasPermission(
        {
          roles: ['SUPERADMIN'],
          status: 'BANNED',
        },
        PERMISSIONS.ARTICLE_PUBLISH,
      ),
    ).toBe(false);
  });

  it('keeps article creation separate from publication', () => {
    const handler = getHandler('create');

    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler)).toBeUndefined();
  });
});
