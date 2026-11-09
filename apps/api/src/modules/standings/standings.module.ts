import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { StandingManagementController } from './standing-management.controller';
import { StandingManagementService } from './standing-management.service';
import { StandingsController } from './standings.controller';
import { StandingsService } from './standings.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [StandingManagementController, StandingsController],
  providers: [StandingManagementService, StandingsService],
})
export class StandingsModule {}
