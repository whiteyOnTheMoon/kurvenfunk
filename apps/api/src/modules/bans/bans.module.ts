import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { IpBlockController, RedCardIpBlockController } from './ip-block.controller';
import { IpBlockService } from './ip-block.service';
import { IpIdentityService } from './ip-identity.service';
import { IpPolicyGuard } from './ip-policy.guard';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [IpBlockController, RedCardIpBlockController],
  providers: [
    IpIdentityService,
    IpBlockService,
    IpPolicyGuard,
    { provide: APP_GUARD, useExisting: IpPolicyGuard },
  ],
})
export class BansModule {}
