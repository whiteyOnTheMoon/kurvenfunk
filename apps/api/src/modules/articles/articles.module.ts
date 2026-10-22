import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ArticleEditorialGuard } from './article-editorial.guard';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleEditorialGuard],
  exports: [ArticlesService],
})
export class ArticlesModule {}
