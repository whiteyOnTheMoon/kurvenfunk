import { Module } from '@nestjs/common';

import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, ArticleEditorialGuard],
  exports: [CategoriesService],
})
export class CategoriesModule {}
