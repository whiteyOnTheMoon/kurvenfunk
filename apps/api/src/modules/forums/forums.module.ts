import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CommentSpamProtectionService } from '../comments/comment-spam-protection.service';
import { UsersModule } from '../users/users.module';
import { ForumThreadsController } from './forum-threads.controller';
import { ForumThreadsService } from './forum-threads.service';
import { ForumsController } from './forums.controller';
import { ForumsService } from './forums.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ForumsController, ForumThreadsController],
  providers: [ForumsService, ForumThreadsService, CommentSpamProtectionService],
})
export class ForumsModule {}
