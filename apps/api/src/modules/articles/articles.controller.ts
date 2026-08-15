import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ArticlesService } from './articles.service';

const STARTPAGE_COMPETITION_SLUG = 'austrian-bundesliga';
const STARTPAGE_NEWS_LIMIT = 20;

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get('startpage/neutral')
  getNeutralStartpage() {
    return this.articlesService.getStartpageNews({
      fanPreference: 'NEUTRAL',
      favoriteClubId: null,
      competitionSlug: STARTPAGE_COMPETITION_SLUG,
      limit: STARTPAGE_NEWS_LIMIT,
    });
  }

  @Get('startpage')
  @UseGuards(AuthGuard)
  getPersonalizedStartpage(@Req() request: AuthenticatedRequest) {
    return this.articlesService.getStartpageNews({
      fanPreference: request.user?.kurvenfunkFanPreference ?? 'NEUTRAL',
      favoriteClubId: request.user?.kurvenfunkFavoriteClubId ?? null,
      competitionSlug: STARTPAGE_COMPETITION_SLUG,
      limit: STARTPAGE_NEWS_LIMIT,
    });
  }
}
