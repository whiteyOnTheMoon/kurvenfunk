import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mediaUploadMetadataSchema, type MediaUploadMetadataInput } from '@kurvenfunk/validation';
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

  @Get(':id/content')
  async getContent(@Param('id') id: string, @Res() response: Response) {
    const content = await this.mediaService.getContent(id);

    response.setHeader('Content-Type', content.mimeType);
    response.setHeader('Content-Length', String(content.sizeBytes));
    response.setHeader('Cache-Control', 'public, max-age=3600');

    response.send(content.body);
  }
}
