import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { IpIdentityService } from './ip-identity.service';
import { ManualIpBanController } from './manual-ip-ban.controller';
import { IpRateLimitGuard } from './ip-rate-limit.guard';
import { TemporaryIpBlockGuard } from './temporary-ip-block.guard';
import { TemporaryIpBlockService } from './temporary-ip-block.service';
import { TrustedClientIpService } from './trusted-client-ip.service';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [ManualIpBanController],
  providers: [
    IpIdentityService,
    TrustedClientIpService,
    IpRateLimitGuard,
    TemporaryIpBlockService,
    TemporaryIpBlockGuard,
    { provide: APP_GUARD, useExisting: TemporaryIpBlockGuard },
    { provide: APP_GUARD, useExisting: IpRateLimitGuard },
  ],
  exports: [IpIdentityService, TemporaryIpBlockService],
})
export class BansModule {}
