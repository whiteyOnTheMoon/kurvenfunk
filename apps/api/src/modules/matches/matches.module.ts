import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MatchManagementController } from './match-management.controller';
import { MatchManagementService } from './match-management.service';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [MatchManagementController, MatchesController],
  providers: [MatchManagementService, MatchesService],
})
export class MatchesModule {}
