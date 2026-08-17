import { Controller, Get, Param } from '@nestjs/common';

import { ClubsService } from './clubs.service';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  findActive() {
    return this.clubsService.findActive();
  }

  @Get(':slug')
  findActiveBySlug(@Param('slug') slug: string) {
    return this.clubsService.findActiveBySlug(slug);
  }
}
