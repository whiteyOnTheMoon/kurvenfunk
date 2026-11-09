import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MatchManagementController } from './match-management.controller';
import { MatchManagementService } from './match-management.service';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { ResultManagementController } from './result-management.controller';
import { ResultManagementService } from './result-management.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [MatchManagementController, ResultManagementController, MatchesController],
  providers: [MatchManagementService, ResultManagementService, MatchesService],
})
export class MatchesModule {}
