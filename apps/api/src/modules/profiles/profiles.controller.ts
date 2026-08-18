import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { fanPreferenceSelectionSchema, type FanPreferenceSelection } from '@kurvenfunk/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getCurrentProfile(@Req() request: AuthenticatedRequest) {
    return this.profilesService.getCurrentProfile(request.user!.kurvenfunkUserId);
  }

  @Get('me/fan-preference')
  @UseGuards(AuthGuard)
  getFanPreference(@Req() request: AuthenticatedRequest) {
    return this.profilesService.getFanPreference(request.user!.kurvenfunkUserId);
  }

  @Patch('me/fan-preference')
  @UseGuards(AuthGuard)
  updateFanPreference(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(fanPreferenceSelectionSchema))
    input: FanPreferenceSelection,
  ) {
    return this.profilesService.updateFanPreference(request.user!.kurvenfunkUserId, input);
  }
}
