import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { IpIdentityService } from './ip-identity.service';
import { IpRateLimitGuard } from './ip-rate-limit.guard';
import { TrustedClientIpService } from './trusted-client-ip.service';

@Module({
  providers: [
    IpIdentityService,
    TrustedClientIpService,
    IpRateLimitGuard,
    { provide: APP_GUARD, useExisting: IpRateLimitGuard },
  ],
  exports: [IpIdentityService],
})
export class BansModule {}
