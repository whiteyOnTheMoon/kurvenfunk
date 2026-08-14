import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.types';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(AuthGuard)
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return {
      id: request.user?.kurvenfunkUserId,
      status: request.user?.kurvenfunkUserStatus,
      subject: request.user?.sub,
    };
  }
}
