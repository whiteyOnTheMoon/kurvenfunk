import { Module } from '@nestjs/common';

import { StorageModule } from '../../infrastructure/storage/storage.module';
import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [AuthModule, UsersModule, StorageModule],
  controllers: [MediaController],
  providers: [MediaService, ArticleEditorialGuard],
  exports: [MediaService],
})
export class MediaModule {}
