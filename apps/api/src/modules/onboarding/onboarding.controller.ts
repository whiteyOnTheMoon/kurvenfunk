import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import {
  completeOnboardingSchema,
  nicknameSchema,
  selectNicknameSchema,
  type CompleteOnboardingInput,
  type SelectNicknameInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('nickname/availability')
  @UseGuards(AuthGuard)
  checkNicknameAvailability(
    @Req() request: AuthenticatedRequest,
    @Query('nickname', new ZodValidationPipe(nicknameSchema))
    nickname: string,
  ) {
    return this.onboardingService.checkNicknameAvailability(
      request.user!.kurvenfunkUserId,
      nickname,
    );
  }

  @Patch('nickname')
  @UseGuards(AuthGuard)
  selectNickname(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(selectNicknameSchema))
    input: SelectNicknameInput,
  ) {
    return this.onboardingService.selectNickname(request.user!.kurvenfunkUserId, input.nickname);
  }

  @Patch('complete')
  @UseGuards(AuthGuard)
  completeOnboarding(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(completeOnboardingSchema))
    input: CompleteOnboardingInput,
  ) {
    return this.onboardingService.completeOnboarding(request.user!.kurvenfunkUserId, input);
  }
}
