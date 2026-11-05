import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CommentReportsModerationController, ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ReportsController, CommentReportsModerationController],
  providers: [ReportsService],
})
export class ReportsModule {}
