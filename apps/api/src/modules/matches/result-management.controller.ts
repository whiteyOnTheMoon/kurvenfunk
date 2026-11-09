import { Body, Controller, Param, ParseUUIDPipe, Patch, Req } from '@nestjs/common';
import { updateMatchResultSchema, type UpdateMatchResultInput } from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { ResultManagementService } from './result-management.service';

@Controller('matches')
export class ResultManagementController {
  constructor(private readonly results: ResultManagementService) {}

  @Patch(':id/result')
  @RequirePermissions(PERMISSIONS.RESULT_MANAGE)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateMatchResultSchema)) input: UpdateMatchResultInput,
  ) {
    return this.results.update(id, input, request.user!.kurvenfunkUserId);
  }
}
