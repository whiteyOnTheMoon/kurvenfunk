import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  createTagSchema,
  updateTagSchema,
  type CreateTagInput,
  type UpdateTagInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthGuard } from '../auth/auth.guard';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tagsService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  create(
    @Body(new ZodValidationPipe(createTagSchema))
    input: CreateTagInput,
  ) {
    return this.tagsService.create(input);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTagSchema))
    input: UpdateTagInput,
  ) {
    return this.tagsService.update(id, input);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
