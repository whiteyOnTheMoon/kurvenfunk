import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ClubsController } from './clubs.controller';
import { ClubOverviewService } from './club-overview.service';
import { ClubsService } from './clubs.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ClubsController],
  providers: [ClubsService, ClubOverviewService],
})
export class ClubsModule {}
