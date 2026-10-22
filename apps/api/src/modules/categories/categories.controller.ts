import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  create(
    @Body(new ZodValidationPipe(createCategorySchema))
    input: CreateCategoryInput,
  ) {
    return this.categoriesService.create(input);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategorySchema))
    input: UpdateCategoryInput,
  ) {
    return this.categoriesService.update(id, input);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
