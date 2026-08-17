import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { cursorPaginationQuerySchema } from '../../common/pagination/cursor-pagination';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ArticlesService } from './articles.service';

const STARTPAGE_COMPETITION_SLUG = 'austrian-bundesliga';
const STARTPAGE_NEWS_LIMIT = 20;

const articleListQuerySchema = cursorPaginationQuerySchema.extend({
  club: z.string().trim().min(1).optional(),
  competition: z.string().trim().min(1).optional(),
});

type ArticleListQuery = z.infer<typeof articleListQuerySchema>;

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  findPublished(
    @Query(new ZodValidationPipe(articleListQuerySchema))
    query: ArticleListQuery,
  ) {
    return this.articlesService.findPublished({
      cursor: query.cursor,
      limit: query.limit,
      clubSlug: query.club,
      competitionSlug: query.competition,
    });
  }

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
