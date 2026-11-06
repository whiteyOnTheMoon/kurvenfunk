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
      roles: request.user?.kurvenfunkRoles ?? [],
      status: request.user?.kurvenfunkUserStatus,
      subject: request.user?.sub,
      fanPreference: request.user?.kurvenfunkFanPreference,
      favoriteClubId: request.user?.kurvenfunkFavoriteClubId,
      onboardingCompleted: request.user?.kurvenfunkOnboardingCompleted,
    };
  }
}
