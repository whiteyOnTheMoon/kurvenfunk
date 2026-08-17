import { Controller, Get, Param } from '@nestjs/common';

import { StandingsService } from './standings.service';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get(':competitionSlug')
  findCurrent(@Param('competitionSlug') competitionSlug: string) {
    return this.standingsService.findCurrent(competitionSlug);
  }
}
