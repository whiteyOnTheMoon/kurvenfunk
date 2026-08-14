import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { selectNicknameSchema, type SelectNicknameInput } from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Patch('nickname')
  @UseGuards(AuthGuard)
  selectNickname(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(selectNicknameSchema))
    input: SelectNicknameInput,
  ) {
    return this.onboardingService.selectNickname(request.user!.kurvenfunkUserId, input.nickname);
  }
}
