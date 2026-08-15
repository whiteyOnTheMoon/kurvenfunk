import { Controller, Get } from '@nestjs/common';

import { ClubsService } from './clubs.service';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  findActive() {
    return this.clubsService.findActive();
  }
}
