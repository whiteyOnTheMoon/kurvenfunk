import { Controller, Get } from '@nestjs/common';

import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';

import { ModerationDashboardService } from './moderation-dashboard.service';

/**
 * Task 187: read-only staff dashboard.
 * SUPERADMIN-only IP detail is kept on a separate guarded route.
 */
@Controller('moderation')
export class ModerationDashboardController {
  constructor(private readonly dashboardService: ModerationDashboardService) {}

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.USER_WARN)
  overview() {
    return this.dashboardService.overview();
  }

  @Get('dashboard/ip-blocks')
  @RequirePermissions(PERMISSIONS.USER_IPBAN)
  ipBlocksSummary() {
    return this.dashboardService.ipBlocksSummary();
  }
}
