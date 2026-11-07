import { Module } from '@nestjs/common';

import { IpIdentityService } from './ip-identity.service';

@Module({
  providers: [IpIdentityService],
  exports: [IpIdentityService],
})
export class BansModule {}
