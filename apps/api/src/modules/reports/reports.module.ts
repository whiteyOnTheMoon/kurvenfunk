import { Module } from '@nestjs/common';
import {
  ForumPostModerationController,
  ForumPostReportsController,
  ForumPostReportsModerationController,
} from './forum-post-reports.controller';
import { ForumPostReportsService } from './forum-post-reports.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CommentReportsModerationController, ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [
    ReportsController,
    CommentReportsModerationController,
    ForumPostReportsController,
    ForumPostReportsModerationController,
    ForumPostModerationController,
  ],
  providers: [ReportsService, ForumPostReportsService],
})
export class ReportsModule {}
