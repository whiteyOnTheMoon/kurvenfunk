import { Module } from '@nestjs/common';

import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ImportsController],
  providers: [ImportsService, ArticleEditorialGuard],
})
export class ImportsModule {}
