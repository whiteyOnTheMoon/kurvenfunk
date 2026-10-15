import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { ArticleEditorialGuard } from '../articles/article-editorial.guard';

import { PermissionsGuard } from './permissions.guard';
import { PermissionsModule } from './permissions.module';
import { PermissionsService } from './permissions.service';

@Module({
  providers: [ArticleEditorialGuard],
})
class EditorialConsumerModule {}

describe('PermissionsModule dependency injection', () => {
  it('provides permissions globally to editorial modules', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PermissionsModule, EditorialConsumerModule],
    }).compile();

    try {
      const permissionsService = moduleRef.get(PermissionsService);

      const permissionsGuard = moduleRef.get(PermissionsGuard);

      const editorialGuard = moduleRef.get(ArticleEditorialGuard);

      expect(permissionsService).toBeInstanceOf(PermissionsService);

      expect(permissionsGuard).toBeInstanceOf(PermissionsGuard);

      expect(editorialGuard).toBeInstanceOf(ArticleEditorialGuard);
    } finally {
      await moduleRef.close();
    }
  });
});
