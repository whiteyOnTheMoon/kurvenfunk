import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@kurvenfunk/types';

import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ImportReplayController } from './import-replay.controller';
import { ImportReplayService } from './import-replay.service';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.NEWS_IMPORT },
      { name: QUEUE_NAMES.NEWS_IMPORT_DEAD_LETTER },
    ),
  ],
  controllers: [ImportsController, ImportReplayController],
  providers: [ImportsService, ImportReplayService, ArticleEditorialGuard],
})
export class ImportsModule {}
