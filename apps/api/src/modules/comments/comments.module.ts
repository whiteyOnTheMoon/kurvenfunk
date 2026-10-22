import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CommentsController } from './comments.controller';
import { CommentSpamProtectionService } from './comment-spam-protection.service';
import { CommentsService } from './comments.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentSpamProtectionService],
})
export class CommentsModule {}
