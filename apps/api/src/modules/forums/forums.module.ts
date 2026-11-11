import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ForumsController } from './forums.controller';
import { ForumsService } from './forums.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ForumsController],
  providers: [ForumsService],
})
export class ForumsModule {}
