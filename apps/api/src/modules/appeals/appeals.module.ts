import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AppealIdentityGuard } from './appeal-identity.guard';
import { AppealsController, ModerationAppealsController } from './appeals.controller';
import { AppealsService } from './appeals.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AppealsController, ModerationAppealsController],
  providers: [AppealIdentityGuard, AppealsService],
})
export class AppealsModule {}
