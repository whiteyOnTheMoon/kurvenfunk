import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import {
  articlePublicationWorkflowSchema,
  createArticleSchema,
  updateArticleSchema,
  type ArticlePublicationWorkflowInput,
  type CreateArticleInput,
  type UpdateArticleInput,
} from '@kurvenfunk/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { cursorPaginationQuerySchema } from '../../common/pagination/cursor-pagination';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ArticleEditorialGuard } from './article-editorial.guard';
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

  @Post()
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createArticleSchema)) input: CreateArticleInput,
  ) {
    return this.articlesService.create(input, request.user!.kurvenfunkUserId);
  }

  @Get('editorial/:id')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  findEditorial(@Param('id') id: string) {
    return this.articlesService.findEditorialById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateArticleSchema)) input: UpdateArticleInput,
  ) {
    return this.articlesService.update(id, input);
  }

  @Patch(':id/publication')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  changePublicationStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(articlePublicationWorkflowSchema))
    input: ArticlePublicationWorkflowInput,
  ) {
    return this.articlesService.changePublicationStatus(id, input);
  }

  @Post(':id/archive')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  archive(@Param('id') id: string) {
    return this.articlesService.archive(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  remove(@Param('id') id: string) {
    return this.articlesService.softDelete(id);
  }

  @Post(':id/restore')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  restore(@Param('id') id: string) {
    return this.articlesService.restore(id);
  }

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

  @Get('by-slug/:slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.articlesService.findPublishedBySlug(slug);
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
