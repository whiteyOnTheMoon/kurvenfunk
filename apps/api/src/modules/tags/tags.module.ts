import { Module } from '@nestjs/common';

import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [TagsController],
  providers: [TagsService, ArticleEditorialGuard],
  exports: [TagsService],
})
export class TagsModule {}
