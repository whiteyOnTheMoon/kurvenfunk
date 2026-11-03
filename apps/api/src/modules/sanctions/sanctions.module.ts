import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { LimitedSanctionsController } from './limited-sanctions.controller';
import { LimitedSanctionsService } from './limited-sanctions.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [LimitedSanctionsController],
  providers: [LimitedSanctionsService],
})
export class SanctionsModule {}
