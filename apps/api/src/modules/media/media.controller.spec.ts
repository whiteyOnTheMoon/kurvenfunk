import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

jest.mock('@kurvenfunk/validation', () => ({
  mediaListQuerySchema: {
    safeParse: (value: unknown) => ({ success: true, data: value }),
  },
  mediaUploadMetadataSchema: {
    safeParse: (value: unknown) => ({ success: true, data: value }),
  },
  updateMediaMetadataSchema: {
    safeParse: (value: unknown) => ({ success: true, data: value }),
  },
}));

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: class AuthGuard {
    canActivate() {
      return true;
    }
  },
}));

jest.mock('../articles/article-editorial.guard', () => ({
  ArticleEditorialGuard: class ArticleEditorialGuard {
    canActivate() {
      return true;
    }
  },
}));

jest.mock('./media.service', () => ({
  MediaService: class MediaService {},
}));

import { MediaController } from './media.controller';
import { MediaService } from './media.service';

describe('MediaController UUID validation', () => {
  let app: INestApplication<App>;
  const getContent = jest.fn();
  const getById = jest.fn();
  const update = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: MediaService,
          useValue: {
            getContent,
            getById,
            update,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a malformed public media ID without touching storage', async () => {
    await request(app.getHttpServer()).get('/api/v1/media/not-a-uuid/content').expect(400);
    expect(getContent).not.toHaveBeenCalled();
  });

  it('rejects malformed media metadata IDs before the service', async () => {
    await request(app.getHttpServer()).get('/api/v1/media/not-a-uuid').expect(400);
    await request(app.getHttpServer())
      .patch('/api/v1/media/not-a-uuid')
      .send({ altText: 'Example' })
      .expect(400);

    expect(getById).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
