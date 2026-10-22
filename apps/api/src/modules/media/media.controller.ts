import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  mediaListQuerySchema,
  mediaUploadMetadataSchema,
  updateMediaMetadataSchema,
  type MediaListQueryInput,
  type MediaUploadMetadataInput,
  type UpdateMediaMetadataInput,
} from '@kurvenfunk/validation';
import type { Response } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthGuard } from '../auth/auth.guard';
import { MediaService, type UploadedMediaFile } from './media.service';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        files: 1,
        fileSize: MAX_UPLOAD_SIZE_BYTES,
      },
    }),
  )
  upload(
    @UploadedFile() file: UploadedMediaFile | undefined,
    @Body(new ZodValidationPipe(mediaUploadMetadataSchema))
    metadata: MediaUploadMetadataInput,
  ) {
    return this.mediaService.upload(file, metadata);
  }

  @Get()
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  list(
    @Query(new ZodValidationPipe(mediaListQuerySchema))
    query: MediaListQueryInput,
  ) {
    return this.mediaService.list(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  getById(@Param('id') id: string) {
    return this.mediaService.getById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, ArticleEditorialGuard)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMediaMetadataSchema))
    input: UpdateMediaMetadataInput,
  ) {
    return this.mediaService.update(id, input);
  }

  @Get(':id/content')
  async getContent(@Param('id') id: string, @Res() response: Response) {
    const content = await this.mediaService.getContent(id);

    response.setHeader('Content-Type', content.mimeType);
    response.setHeader('Content-Length', String(content.sizeBytes));
    response.setHeader('Cache-Control', 'public, max-age=3600');

    response.send(content.body);
  }
}
