import { Controller, Get, Param, Query } from '@nestjs/common';

import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  findSchedule(@Query('competition') competition?: string) {
    return this.matchesService.findSchedule(competition);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.matchesService.findById(id);
  }
}
