import { Controller, Get, Param } from '@nestjs/common';

import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.matchesService.findById(id);
  }
}
