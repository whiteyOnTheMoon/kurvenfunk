import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ReactionSummariesController, ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ReactionsController, ReactionSummariesController],
  providers: [ReactionsService],
})
export class ReactionsModule {}
